(function () {
    // Prevent double injection
    if (window.crmReactExtractorInjected) return;
    window.crmReactExtractorInjected = true;



    // --- WPPCONNECT LOADER START ---
    console.log('[CRM DEBUG] Injected Script Loaded (v2.2 - Attendance Fallback)');

    // DEBUG: Monitor WPP State
    const wppDebug = setInterval(() => {
        if (window.WPP) {
            console.log('[CRM DEBUG] WPP Status:', {
                ready: window.WPP.webpack?.isReady,
                auth: window.WPP.conn?.isRegistered(),
                me: window.WPP.conn?.getMyUserId ? window.WPP.conn.getMyUserId() : 'N/A'
            });
            if (window.WPP.webpack?.isReady) clearInterval(wppDebug);
        }
    }, 2000);

    // 1. Inject WPPConnect Script from EXTENSION RESOURCES (Fix CSP)
    // We assume the extension content script injected a helper to get the URL
    // BUT wait, injected.js runs in page context, it CANNOT call chrome.runtime.getURL.
    // The content script (index.tsx) must inject the URL or the script itself.
    // Actually, we can just use the src that we inject.
    // Index.tsx should inject this script.

    // WAIT! If I inject wppconnect.js directly from index.tsx as a script tag, 
    // it will execute.
    // So I don't need injected.js to load it?
    // Correct. WPPConnect is a library. If I just inject it, it attaches to window.WPP.

    // So... I should modify index.tsx to inject BOTH injected.js AND wppconnect.js?
    // YES.



    // 2. Wait for it to be ready
    const check = setInterval(() => {
        if (window.WPP && window.WPP.webpack && window.WPP.webpack.isReady) {
            clearInterval(check);
        }
    }, 500);
    // --- WPPCONNECT LOADER END ---

    const waitForWppReady = async (timeoutMs) => {
        const limit = typeof timeoutMs === 'number' ? timeoutMs : 2000;
        const startedAt = Date.now();
        while (Date.now() - startedAt < limit) {
            if (window.WPP && window.WPP.webpack && window.WPP.webpack.isReady) {
                return true;
            }
            await new Promise((resolve) => setTimeout(resolve, 250));
        }
        return false;
    };

    const pinActiveChat = async () => {
        const ready = await waitForWppReady(1500);
        if (!ready || !window.WPP || !window.WPP.chat) {
            console.warn('[CRM] WPP not ready for pin');
            return;
        }
        const chat = window.WPP.chat.getActive ? window.WPP.chat.getActive() : null;
        const chatId = chat?.id?._serialized || chat?.id?.toString?.() || chat?.id?.user || '';
        if (!chatId || typeof window.WPP.chat.pin !== 'function') {
            console.warn('[CRM] Pin function not available');
            return;
        }
        try {
            await window.WPP.chat.pin(chatId);
            console.log('[CRM] Chat pinned', chatId);
        } catch (err) {
            console.error('[CRM] Pin failed', err);
        }
    };

    const requestTransferAttendance = () => {
        window.postMessage({ type: 'CRM_TOOL_TRANSFER' }, '*');
    };

    const requestCloseAttendance = () => {
        window.postMessage({ type: 'CRM_TOOL_CLOSE' }, '*');
    };

    const getWidValue = (value) => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'number') return String(value);
        if (typeof value === 'object') {
            if (typeof value.number === 'string') return value.number;
            if (typeof value.number === 'number') return String(value.number);
            if (typeof value.phone === 'string') return value.phone;
            if (typeof value.phone === 'number') return String(value.phone);
            if (typeof value.user === 'string') return value.user;
            if (typeof value.user === 'number') return String(value.user);
            if (typeof value._serialized === 'string') return value._serialized;
            if (typeof value.id === 'string') return value.id;
            if (typeof value.id === 'number') return String(value.id);
            if (value.id && typeof value.id._serialized === 'string') return value.id._serialized;
            if (value.wid && typeof value.wid._serialized === 'string') return value.wid._serialized;
            if (value.wid && typeof value.wid.user === 'string') return value.wid.user;
        }
        if (value && typeof value.toString === 'function') {
            const str = value.toString();
            if (str && str !== '[object Object]') return str;
        }
        return '';
    };

    const getSerializedId = (value) => {
        if (!value) return '';
        if (typeof value === 'string') return value;
        if (typeof value === 'object' && typeof value._serialized === 'string') return value._serialized;
        return getWidValue(value);
    };

    const extractPhone = (value) => {
        const raw = getWidValue(value);
        if (!raw) return '';
        const withoutDomain = raw.includes('@') ? raw.split('@')[0] : raw;
        return withoutDomain.includes(':') ? withoutDomain.split(':')[0] : withoutDomain;
    };

    const normalizePhone = (value) => {
        const raw = extractPhone(value);
        if (!raw) return '';
        const digits = raw.replace(/\D/g, '');
        return digits || raw;
    };

    const normalizeTextKey = (value) => {
        if (!value) return '';
        return String(value)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    };

    const getFormattedUser = (contact) => {
        try {
            if (typeof contact?.getFormattedUser === 'function') {
                return contact.getFormattedUser();
            }
        } catch {
            // Ignore if getter fails.
        }
        return contact?.formattedUser || contact?.formattedPhone || contact?.userid || '';
    };

    const resolveContactPhone = (contact) => {
        if (!contact) return '';
        return (
            normalizePhone(contact.phoneNumber) ||
            normalizePhone(contact.contact?.phoneNumber) ||
            normalizePhone(contact.contact?.id) ||
            normalizePhone(contact.contact?.wid) ||
            normalizePhone(contact.id?.user) ||
            normalizePhone(contact.id?._serialized) ||
            normalizePhone(contact.id) ||
            normalizePhone(contact.userid) ||
            normalizePhone(getFormattedUser(contact))
        );
    };

    const isMyContact = (contact) => {
        if (!contact) return false;
        try {
            if (typeof contact.isMyContact === 'function') {
                return !!contact.isMyContact();
            }
        } catch {
            // Ignore and fallback below.
        }
        return contact.isMyContact === true || contact.isMyContact === 1 || contact.isMyContact === 'true';
    };

    const resolveFlag = (value, context) => {
        if (typeof value === 'function') {
            try {
                return !!value.call(context);
            } catch {
                return false;
            }
        }
        return value === true || value === 1 || value === 'true';
    };

    const isGroupContact = (contact) => {
        if (!contact) return false;
        if (resolveFlag(contact.isGroup, contact)) return true;
        const serializedId = getSerializedId(contact.id);
        return !!serializedId && serializedId.includes('@g.us');
    };

    const isBroadcastContact = (contact) => {
        if (!contact) return false;
        if (resolveFlag(contact.isBroadcast, contact)) return true;
        const serializedId = getSerializedId(contact.id);
        return !!serializedId && (serializedId.includes('broadcast') || serializedId.includes('newsletter'));
    };

    const uniqByPhoneOrId = (items) => {
        const seen = new Set();
        return items.filter((item) => {
            const key = item.phone || item.id;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const isSystemPhone = (value) => {
        const digits = normalizePhone(value);
        if (!digits) return false;
        // Filter out WhatsApp/Meta AI test numbers (e.g. 1-313-555-000x, 1-650-555-0100).
        if (/^1\d{3}5550\d{3}$/.test(digits)) return true;
        if (/^\d{3}5550\d{3}$/.test(digits)) return true;
        return false;
    };

    const isSystemContactPayload = (item) => {
        if (!item) return true;
        const id = String(item.id || '');
        if (id.includes('@s.whatsapp.net') || id.includes('status@broadcast')) return true;
        const nameKey = normalizeTextKey(item.name);
        if (nameKey.includes('meta ai') || nameKey.includes('whatsapp') || nameKey.includes('support')) return true;
        const digits = normalizePhone(item.phone || item.id);
        if (digits && (digits.length < 8 || digits.length > 13)) return true;
        if (isSystemPhone(digits)) return true;
        return false;
    };

    const mapContactPayload = (contact) => {
        const id = getSerializedId(contact.id) || getSerializedId(contact);
        const phone = resolveContactPhone(contact) || normalizePhone(id);
        return {
            id,
            name: contact.name || contact.pushname || contact.formattedName || contact.shortName || contact.verifiedName || 'Contato',
            phone,
            isMyContact: isMyContact(contact),
            isBusiness: contact.isBusiness
        };
    };

    const mapContactPayloadFromId = (contact) => {
        const id = getSerializedId(contact.id) || getSerializedId(contact);
        return {
            id,
            name: contact.name || contact.pushname || contact.formattedName || contact.shortName || contact.verifiedName || 'Contato',
            phone: normalizePhone(id) || resolveContactPhone(contact),
            isMyContact: isMyContact(contact),
            isBusiness: contact.isBusiness
        };
    };

      const buildRecentChatsPayload = (chats) => (chats || [])
          .filter(() => {
              // RECENT CHATS: ALLOW EVERYTHING (Groups, Channels, Unsaved)
              // User wants exact mirror of WhatsApp Web Chat List
              return true;
          })
          .map(c => {
              const chatId = getSerializedId(c?.id) || getSerializedId(c?.wid) || getSerializedId(c?.chatId) || getSerializedId(c);
              if (!chatId) return null;
              const idServer =
                  c?.id?.server ||
                  (chatId.includes('@') ? chatId.split('@')[1] : '');
              const isGroup = c.isGroup || idServer === 'g.us';
              const isNewsletter = c.isNewsletter || idServer === 'newsletter';
              const isBroadcast = idServer === 'broadcast';
  
              let displayPhone = resolveContactPhone(c) || extractPhone(c.id?.user || c.id?._serialized || chatId);

            if (isGroup) {
                displayPhone = 'Grupo';
            } else if (isNewsletter) {
                displayPhone = 'Canal';
            } else if (isBroadcast) {
                displayPhone = 'Lista de Transmissǜo';
            } else {
                // PRIVATE CHAT (User or LID)
                // Try to get real phone if it is a LID
                if (idServer === 'lid') {
                    const resolvedPhone = resolveContactPhone(c);
                    displayPhone = resolvedPhone || 'Conta Comercial';
                }
                // Normal c.us usually puts phone in id.user correct? Yes.
            }

              const resolveLastMsg = () => {
                  if (c.lastMsg) return c.lastMsg;
                  if (c.lastMessage) return c.lastMessage;
                  if (c.msgs?.last && typeof c.msgs.last === 'function') {
                      return c.msgs.last();
                  }
                  if (Array.isArray(c.msgs?.models) && c.msgs.models.length) {
                      return c.msgs.models[c.msgs.models.length - 1];
                  }
                  return null;
              };

              const lastMsg = resolveLastMsg();
              const lastMessageId =
                  getSerializedId(lastMsg?.id) ||
                  getSerializedId(c.lastMsgKey) ||
                  getSerializedId(c.lastMessageKey) ||
                  getSerializedId(c.lastReceivedKey) ||
                  lastMsg?.id?.id ||
                  lastMsg?.id ||
                  '';
              const lastMessageTimestamp =
                  lastMsg?.t ||
                  lastMsg?.timestamp ||
                  c.t ||
                  c.lastMessageTimestamp ||
                  c.lastMessageTime ||
                  c.lastReceivedTime ||
                  c.lastMsgTime ||
                  null;
              const lastMessageAuthor =
                  getSerializedId(lastMsg?.author) ||
                  getSerializedId(lastMsg?.from) ||
                  getSerializedId(lastMsg?.sender) ||
                  getSerializedId(lastMsg?.id?.participant) ||
                  '';
              const lastMessageFromMe =
                  typeof lastMsg?.fromMe === 'boolean'
                      ? lastMsg.fromMe
                      : typeof lastMsg?.isSentByMe === 'boolean'
                          ? lastMsg.isSentByMe
                          : typeof lastMsg?.id?.fromMe === 'boolean'
                              ? lastMsg.id.fromMe
                              : typeof c.lastMessageFromMe === 'boolean'
                                  ? c.lastMessageFromMe
                                  : typeof c.lastMessage?.fromMe === 'boolean'
                                      ? c.lastMessage.fromMe
                                      : typeof c.lastMessage?.isSentByMe === 'boolean'
                                          ? c.lastMessage.isSentByMe
                                          : null;
              const lastMessageBody = lastMsg?.body || lastMsg?.type || c.lastMessage?.body || '';

              return {
                  id: chatId,
                  name: c.name || c.pushname || c.formattedTitle || c.contact?.name || c.contact?.pushname || c.contact?.shortName || displayPhone,
                  phone: displayPhone,
                  isGroup: isGroup,
                  isNewsletter: isNewsletter,
                  isBroadcast: isBroadcast,
                  unread: c.unreadCount || 0,
                  lastMessage: lastMessageBody,
                  lastMessageId,
                  lastMessageTimestamp,
                  lastMessageFromMe,
                  lastMessageAuthor
              };
          })
          .filter(Boolean);

    if (!window.__IVILLAR_DEBUG_RECENTS__) {
        window.__IVILLAR_DEBUG_RECENTS__ = async () => {
            const ready = await waitForWppReady(4000);
            if (!ready || !window.WPP || !window.WPP.chat) {
                console.warn('[CRM DEBUG] WPP not ready for recents debug');
                return;
            }

            const chats = await window.WPP.chat.list();
            const payload = buildRecentChatsPayload(chats);
            const rawIds = new Set((chats || []).map(c => c?.id?._serialized).filter(Boolean));
            const payloadIds = new Set((payload || []).map(c => c?.id).filter(Boolean));
            const missingInPayload = [...rawIds].filter((id) => !payloadIds.has(id));
            const extraInPayload = [...payloadIds].filter((id) => !rawIds.has(id));

            console.log('[CRM DEBUG] Recents check', {
                wppTotal: rawIds.size,
                payloadTotal: payloadIds.size,
                missingCount: missingInPayload.length,
                extraCount: extraInPayload.length
            });
            if (missingInPayload.length) {
                console.log('[CRM DEBUG] Missing in payload sample', missingInPayload.slice(0, 20));
            }
            if (extraInPayload.length) {
                console.log('[CRM DEBUG] Extra in payload sample', extraInPayload.slice(0, 20));
            }
            console.table(payload.slice(0, 10));
        };
    }

    // Listener for Extension Commands
    window.addEventListener('message', async (event) => {
        // 1. INVISIBLE SEND
        if (event.data.type === 'CRM_SEND_INVISIBLE') {
            const { phone, text, chatId } = event.data;
            const ready = await waitForWppReady(8000);
            if (!ready || !window.WPP || !window.WPP.chat) {
                console.error('[CRM] WPP not ready yet.');
                window.postMessage({ type: 'CRM_SEND_ERROR', phone, error: 'WPP not ready' }, '*');
                return;
            }
            try {
                // If chatId is provided (e.g. from Recents), use it directly. 
                // Otherwise build from phone (DB contacts).
                let finalChatId = chatId;
                if (!finalChatId) {
                    const cleanPhone = phone.replace(/\D/g, '');
                    finalChatId = cleanPhone + '@c.us';
                }

                const sendFn = window.WPP.chat.sendTextMessage || window.WPP.chat.sendTextMsg;
                if (typeof sendFn !== 'function') throw new Error('Send function not found');

                await sendFn(finalChatId, text);
                window.postMessage({ type: 'CRM_SEND_SUCCESS', phone }, '*');
            } catch (e) {
                console.error('[CRM] Send Failed', e);
                window.postMessage({ type: 'CRM_SEND_ERROR', phone, error: e.toString() }, '*');
            }
        }

        if (event.data.type === 'CRM_GET_CHATS') {
            try {
                const ready = await waitForWppReady(4000);
                let chats = [];
                let usedFallback = false;

                if (ready && window.WPP && window.WPP.chat && typeof window.WPP.chat.list === 'function') {
                    try {
                        // Removed { count: 50 } to fetch all available chats
                        chats = await window.WPP.chat.list();
                    } catch (err) {
                        console.warn('[CRM] WPP chat.list failed, trying fallback', err);
                    }
                }

                if (!Array.isArray(chats) || !chats.length) {
                    const store = window.Store || window.WAStore;
                    const collection = store?.Chat;
                    const fallback =
                        collection?.models ||
                        (typeof collection?.getModelsArray === 'function' ? collection.getModelsArray() : null) ||
                        (typeof collection?.getModels === 'function' ? collection.getModels() : null) ||
                        [];
                    if (Array.isArray(fallback) && fallback.length) {
                        chats = fallback;
                        usedFallback = true;
                    }
                }

                if (!Array.isArray(chats) || !chats.length) {
                    console.error('[CRM] WPP chats not available');
                    window.postMessage({ type: 'CRM_CHATS_ERROR', error: 'Chats not available' }, '*');
                    return;
                }

                // Removed slice(0, 100)
                const payload = buildRecentChatsPayload(chats);

                // Sort by last message time if available? WPP usually returns sorted.

console.log(`[CRM] Fetched ${payload.length} Recent Chats${usedFallback ? ' (fallback)' : ''}`);
                window.postMessage({ type: 'CRM_CHATS_SUCCESS', chats: payload }, '*');
            } catch (e) {
                console.error('[CRM] Fetch chats failed', e);
                window.postMessage({ type: 'CRM_CHATS_ERROR', error: e.toString() }, '*');
            }
        }

        // 3. GET ME (Current User ID)
        if (event.data.type === 'CRM_GET_ME') {
            try {
                const ready = await waitForWppReady(1500);
                let myId = null;

                if (ready && window.WPP && window.WPP.conn && typeof window.WPP.conn.getMyUserId === 'function') {
                    myId = window.WPP.conn.getMyUserId();
                }

                // FIX: handle object return (WPPConnect sometimes returns { _serialized: ... })
                if (typeof myId === 'object' && myId !== null) {
                    myId = myId._serialized || myId.user;
                }

                // Fallback: try WA Store (when WPP not ready)
                if (!myId) {
                    try {
                        const store = window.Store || window.WAStore;
                        const conn = store?.Conn || store?.ConnStore || store?.WidFactory;
                        const wid = conn?.me || conn?.wid || conn?.user;
                        if (wid) {
                            myId = wid._serialized || wid.user || wid;
                        }
                    } catch (err) {
                        console.error('[CRM DEBUG] Store fallback failed:', err);
                    }
                }

                // FALLBACK: Try localStorage (Standard WhatsApp Web storage key)
                if (!myId) {
                    try {
                        const keys = ['last-wid', 'last-wid-md', 'last-wid-web', 'last-wid-desktop'];
                        for (const key of keys) {
                            const localWid = localStorage.getItem(key);
                            if (localWid) {
                                console.log('[CRM DEBUG] Found Owner ID in localStorage:', localWid);
                                myId = localWid.replace(/"/g, '');
                                break;
                            }
                        }
                    } catch (err) {
                        console.error('[CRM DEBUG] localStorage fallback failed:', err);
                    }
                }

                if (!myId) {
                    console.error('[CRM] Owner ID not available');
                    window.postMessage({ type: 'CRM_ME_ERROR', error: 'Owner ID unavailable' }, '*');
                    return;
                }

                const cleanId = myId ? (normalizePhone(myId) || extractPhone(myId)) : null;
                console.log('[CRM DEBUG] Consolidating Owner ID:', cleanId);
                window.postMessage({ type: 'CRM_ME_SUCCESS', me: cleanId }, '*');
            } catch (e) {
                console.error('[CRM] GET_ME Failed', e);
                window.postMessage({ type: 'CRM_ME_ERROR', error: String(e) }, '*');
            }
        }

        // 4. GET CONTACTS (Address Book)
        if (event.data.type === 'CRM_GET_CONTACTS') {
            const ready = await waitForWppReady(8000);
            if (!ready || !window.WPP || !window.WPP.contact) {
                console.error('[CRM] WPP.contact not ready');
                window.postMessage({ type: 'CRM_CONTACTS_ERROR', error: 'WPP not ready' }, '*');
                return;
            }
            try {
                let contacts = [];
                let usedOnlyMyContacts = false;
                const attemptList = async () => {
                    try {
                        const data = await window.WPP.contact.list({ onlyMyContacts: true });
                        if (Array.isArray(data)) {
                            usedOnlyMyContacts = true;
                            return data;
                        }
                    } catch {
                        // Ignore and try fallback.
                    }
                    try {
                        const data = await window.WPP.contact.list();
                        if (Array.isArray(data)) {
                            usedOnlyMyContacts = false;
                            return data;
                        }
                    } catch {
                        // Ignore and return empty.
                    }
                    return [];
                };

                for (let attempt = 0; attempt < 3; attempt += 1) {
                    contacts = await attemptList();
                    if (contacts.length) break;
                    await new Promise((resolve) => setTimeout(resolve, 800));
                }

                if (!contacts.length) {
                    let chats = [];
                    try {
                        chats = await window.WPP.chat.list({ onlyUsers: true });
                    } catch {
                        chats = await window.WPP.chat.list();
                    }
                    const fromChats = (chats || [])
                        .map((chat) => chat.contact || chat)
                        .filter((contact) => contact && isMyContact(contact));
                    contacts = fromChats;
                    usedOnlyMyContacts = true;
                }
                console.log(`[CRM] Contacts fetched: ${contacts.length} (onlyMyContacts=${usedOnlyMyContacts})`);
                if (!window.__IVILLAR_CONTACT_SAMPLE__ && contacts.length) {
                    const sample = contacts[0];
                    window.__IVILLAR_CONTACT_SAMPLE__ = true;
                    console.log('[CRM] Contact sample', {
                        type: typeof sample,
                        idType: typeof sample?.id,
                        idSerialized: sample?.id?._serialized,
                        idUser: sample?.id?.user,
                        idToString: sample?.id && typeof sample.id.toString === 'function' ? sample.id.toString() : null,
                        phoneNumber: sample?.phoneNumber,
                        formattedUser: sample?.formattedUser,
                        formattedPhone: sample?.formattedPhone,
                        userid: sample?.userid,
                        getFormattedUser: sample && typeof sample.getFormattedUser === 'function' ? sample.getFormattedUser() : null
                    });
                }

                // Advanced Filter:
                // 1. Exclude Groups
                // 2. Exclude Broadcast lists & Newsletters
                // 3. Must be a "Saved Contact" (isMyContact) OR have a valid Name that is NOT just the number
                const valid = contacts.filter(c => {
                    // STRICT: Only Address Book (Saved Contacts)
                    if (isGroupContact(c)) return false;
                    if (isBroadcastContact(c)) return false;

                    // Must be explicitly saved in phone address book
                    return usedOnlyMyContacts ? true : isMyContact(c);
                });

                let payload = uniqByPhoneOrId(
                    valid
                        .map(mapContactPayload)
                        .filter((item) => item.phone || item.id)
                );

                if (!payload.length && valid.length) {
                    payload = uniqByPhoneOrId(
                        valid
                            .map(mapContactPayloadFromId)
                            .filter((item) => item.phone || item.id)
                    );
                }

                payload = payload.filter((item) => !isSystemContactPayload(item));

                if (!payload.length && contacts.length && !window.__IVILLAR_CONTACT_FILTER_DEBUG__) {
                    const sample = contacts[0];
                    window.__IVILLAR_CONTACT_FILTER_DEBUG__ = true;
                    console.log('[CRM] Contact filter counts', {
                        total: contacts.length,
                        valid: valid.length,
                        usedOnlyMyContacts
                    });
                    console.log('[CRM] Contact filter sample', {
                        idSerialized: getSerializedId(sample?.id),
                        isGroupType: typeof sample?.isGroup,
                        isGroupValue: isGroupContact(sample),
                        isBroadcastType: typeof sample?.isBroadcast,
                        isBroadcastValue: isBroadcastContact(sample),
                        isMyContactType: typeof sample?.isMyContact,
                        isMyContactValue: isMyContact(sample)
                    });
                }

                if (!window.__IVILLAR_CONTACT_PAYLOAD_SAMPLE__ && payload.length) {
                    window.__IVILLAR_CONTACT_PAYLOAD_SAMPLE__ = true;
                    console.log('[CRM] Contact payload sample', payload[0]);
                }

                console.log(`[CRM] Fetched ${payload.length} unique contacts`);
                window.postMessage({ type: 'CRM_CONTACTS_SUCCESS', contacts: payload }, '*');
            } catch (e) {
                console.error('[CRM] Fetch contacts failed', e);
                window.postMessage({ type: 'CRM_CONTACTS_ERROR', error: String(e) }, '*');
            }
        }

        // 5. GET ACTIVE CHAT (Directly from WPP)
        if (event.data.type === 'CRM_GET_ACTIVE_CHAT') {
            try {
                const ready = await waitForWppReady(1500);
                if (!ready || !window.WPP || !window.WPP.chat) {
                    window.postMessage({ type: 'CRM_ACTIVE_CHAT_SUCCESS', chat: null }, '*');
                    return;
                }
                const chat = window.WPP && window.WPP.chat && window.WPP.chat.getActive ? window.WPP.chat.getActive() : null;
                console.log('[CRM] CRM_GET_ACTIVE_CHAT requested. Chat found:', !!chat);

                if (chat) {
                    const id = chat.id._serialized;
                    const isGroup = chat.isGroup || chat.id?.server === 'g.us';
                    const resolvedPhone = resolveContactPhone(chat) || resolveContactPhone(chat.contact) || extractPhone(chat.id?.user || chat.id?._serialized);
                    const phone = isGroup ? '' : resolvedPhone;
                    const name = chat.name || chat.pushname || chat.formattedTitle || chat.contact?.name || chat.contact?.pushname || 'Sem Nome';

                    window.postMessage({
                        type: 'CRM_ACTIVE_CHAT_SUCCESS',
                        chat: { id, phone, name, isGroup }
                    }, '*');
                } else {
                    window.postMessage({ type: 'CRM_ACTIVE_CHAT_SUCCESS', chat: null }, '*');
                }
            } catch (e) {
                console.error('[CRM] Get Active Chat Failed', e);
                window.postMessage({ type: 'CRM_ACTIVE_CHAT_ERROR', error: String(e) }, '*');
            }
        }
    });

    const TOOLBAR_ID = 'crm-chat-tools';

    const createToolButton = (label, svgPath) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', label);
        btn.title = label;
        btn.style.width = '28px';
        btn.style.height = '28px';
        btn.style.borderRadius = '8px';
        btn.style.border = '1px solid #e2e8f0';
        btn.style.background = '#f8fafc';
        btn.style.display = 'inline-flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.color = '#334155';
        btn.style.cursor = 'pointer';
        btn.style.transition = 'background 0.15s ease';
        btn.addEventListener('mouseenter', () => {
            btn.style.background = '#f1f5f9';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = '#f8fafc';
        });
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${svgPath}
            </svg>
        `;
        return btn;
    };

    const ensureHeaderTools = () => {
        const header = document.querySelector('#main header');
        if (!header) return;
        if (document.getElementById(TOOLBAR_ID)) return;

        const container = document.createElement('div');
        container.id = TOOLBAR_ID;
        container.style.display = 'inline-flex';
        container.style.alignItems = 'center';
        container.style.gap = '8px';
        container.style.marginLeft = '8px';
        container.style.flexShrink = '0';

        const pinButton = createToolButton('Fixar chat', '<path d="M16 3l5 5-4 4-2 6-2-2-4 4-1-1 4-4-2-2 6-2 4-4-4-4z" />');
        pinButton.addEventListener('click', (event) => {
            event.stopPropagation();
            pinActiveChat();
        });

        const transferButton = createToolButton(
            'Transferir atendimento',
            '<path d="M5 12h12" /><path d="M13 6l6 6-6 6" />'
        );
        transferButton.addEventListener('click', (event) => {
            event.stopPropagation();
            requestTransferAttendance();
        });

        const closeButton = createToolButton(
            'Encerrar atendimento',
            '<path d="M12 2v10" /><path d="M5.5 5.5a6.5 6.5 0 1 0 13 0" />'
        );
        closeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            requestCloseAttendance();
        });

        container.appendChild(pinButton);
        container.appendChild(transferButton);
        container.appendChild(closeButton);
        header.appendChild(container);
    };

    const toolbarObserver = new MutationObserver(() => {
        ensureHeaderTools();
    });
    toolbarObserver.observe(document.body, { childList: true, subtree: true });
    ensureHeaderTools();

    // --- DOM SCANNER (LEGACY BACKUP) ---
    function findReactKey(node) {
        for (const key in node) {
            if (key.startsWith('__reactProps') || key.startsWith('__reactFiber')) {
                return key;
            }
        }
        return null;
    }

    function extractJidRecursively(fiber) {
        if (!fiber) return null;
        if (fiber.memoizedProps) {
            const props = fiber.memoizedProps;
            if (props.data && props.data.id && typeof props.data.id === 'object' && props.data.id._serialized) return props.data.id._serialized;
            if (props.item && props.item.id && typeof props.item.id === 'object' && props.item.id._serialized) return props.item.id._serialized;
            if (props.contact && props.contact.id && typeof props.contact.id === 'object' && props.contact.id._serialized) return props.contact.id._serialized;
            if (props.jid && typeof props.jid === 'string' && props.jid.includes('@c.us')) return props.jid;
            if (props.id && typeof props.id === 'string' && props.id.includes('@c.us')) return props.id;
        }
        return null;
    }

    window.crmScanForJids = function () {
        const listItems = document.querySelectorAll('div[role="listitem"], div[role="button"]');
        let tagged = 0;

        listItems.forEach(item => {
            if (item.dataset.crmJid) return;
            const key = findReactKey(item);
            if (key) {
                let fiber = item[key];
                let found = null;
                let depth = 0;
                while (fiber && depth < 10) {
                    found = extractJidRecursively(fiber);
                    if (found) break;
                    fiber = fiber.return;
                    depth++;
                }
                if (found) {
                    item.setAttribute('data-crm-jid', found);
                    tagged++;
                }
            }
        });
        return tagged;
    };

    document.addEventListener('crm-trigger-scan', function () {
        window.crmScanForJids();
    });

})();
