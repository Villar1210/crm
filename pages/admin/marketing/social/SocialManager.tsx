import React, { useEffect, useMemo, useState } from 'react';
import {
  siFacebook,
  siInstagram,
  siTiktok,
  siPinterest,
  siYoutube,
  siThreads,
  siX,
  siGoogle,
  siGoogleanalytics
} from 'simple-icons';

// LinkedIn icon missing from installed simple-icons package, defining locally
const siLinkedin = {
  title: 'LinkedIn',
  slug: 'linkedin',
  hex: '0A66C2',
  path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
};
import {
  ArrowRight,
  BarChart2,
  BarChart3,
  CalendarCheck,
  ChevronDown,
  Hash,
  Heart,
  Instagram,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  PenLine,
  Plus,
  Repeat,
  Scissors,
  Search,
  Settings,
  Share2,
  Target,
  UploadCloud,
  Video,
  X,
  Eye
} from 'lucide-react';
import { socialService } from '../../../../services/socialService';
import { API_BASE_URL } from '../../../../services/apiConfig';
import type {
  SocialAccountConnection,
  SocialIntegration,
  SocialKpi,
  SocialMediaItem,
  SocialNetworkSummary,
  SocialPost,
  SocialStatus
} from '../../../../types/social';

type SocialSection = 'connections' | 'schedule' | 'calendar' | 'library' | 'timeline' | 'reports';

type SocialPlacement =
  | 'instagram_feed'
  | 'instagram_story'
  | 'instagram_reels'
  | 'facebook_feed'
  | 'tiktok_video'
  | 'linkedin_feed'
  | 'pinterest_pin'
  | 'threads_post'
  | 'x_post'
  | 'youtube_video';

interface SelectedChannel {
  provider: SocialIntegration;
  placements: SocialPlacement[];
}

type MediaFile = {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  url?: string;
};

type AdvancedSettingKey =
  | 'instagram_shop'
  | 'location'
  | 'first_comment'
  | 'disable_comments'
  | 'people_tag';

const sectionTabs: { id: SocialSection; label: string }[] = [
  { id: 'connections', label: 'Conexões' },
  { id: 'schedule', label: 'Agendar Post' },
  { id: 'calendar', label: 'Calendário' },
  { id: 'library', label: 'Biblioteca de Mídia' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'reports', label: 'Relatórios' }
];



// Wrapper for Simple Icons to match Lucide interface roughly
const SimpleIcon = ({ icon, size = 18, className }: { icon: any; size?: number; className?: string }) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    width={size}
    height={size}
    className={`fill-current ${className}`}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d={icon.path} />
  </svg>
);

const providerMeta: Record<
  SocialIntegration,
  { label: string; icon: any; isSimpleIcon?: boolean; bg: string; text: string }
> = {
  instagram: {
    label: 'Instagram',
    icon: siInstagram,
    isSimpleIcon: true,
    bg: 'bg-pink-50',
    text: 'text-[#E4405F]' // Brand color
  },
  facebook: {
    label: 'Facebook',
    icon: siFacebook,
    isSimpleIcon: true,
    bg: 'bg-blue-50',
    text: 'text-[#1877F2]'
  },
  linkedin: {
    label: 'LinkedIn',
    icon: siLinkedin,
    isSimpleIcon: true,
    bg: 'bg-sky-50',
    text: 'text-[#0A66C2]'
  },
  tiktok: {
    label: 'TikTok',
    icon: siTiktok,
    isSimpleIcon: true,
    bg: 'bg-slate-100',
    text: 'text-[#000000]'
  },
  googleMyBusiness: {
    label: 'Google Meu Negócio',
    icon: siGoogle,
    isSimpleIcon: true,
    bg: 'bg-emerald-50',
    text: 'text-[#4285F4]'
  },
  pinterest: {
    label: 'Pinterest',
    icon: siPinterest,
    isSimpleIcon: true,
    bg: 'bg-rose-50',
    text: 'text-[#BD081C]'
  },
  youtube: {
    label: 'YouTube',
    icon: siYoutube,
    isSimpleIcon: true,
    bg: 'bg-red-50',
    text: 'text-[#FF0000]'
  },
  threads: {
    label: 'Threads',
    icon: siThreads,
    isSimpleIcon: true,
    bg: 'bg-slate-100',
    text: 'text-[#000000]'
  },
  x: {
    label: 'X (Twitter)',
    icon: siX,
    isSimpleIcon: true,
    bg: 'bg-slate-100',
    text: 'text-[#000000]'
  },
  ga4: {
    label: 'Google Analytics 4',
    icon: siGoogleanalytics,
    isSimpleIcon: true,
    bg: 'bg-amber-50',
    text: 'text-[#E37400]'
  },
  rdStation: {
    label: 'RD Station',
    icon: Target, // Keep Lucide for RD Station as it's not in simple-icons standard likely
    bg: 'bg-orange-50',
    text: 'text-orange-600'
  }
};

const placementOptions: Record<SocialIntegration, { label: string; value: SocialPlacement }[]> =
{
  instagram: [
    { label: 'Feed', value: 'instagram_feed' },
    { label: 'Story', value: 'instagram_story' },
    { label: 'Reels', value: 'instagram_reels' }
  ],
  facebook: [{ label: 'Feed', value: 'facebook_feed' }],
  tiktok: [{ label: 'Vídeo', value: 'tiktok_video' }],
  linkedin: [{ label: 'Feed', value: 'linkedin_feed' }],
  pinterest: [{ label: 'Pin', value: 'pinterest_pin' }],
  threads: [{ label: 'Post', value: 'threads_post' }],
  x: [{ label: 'Post', value: 'x_post' }],
  youtube: [{ label: 'Vídeo', value: 'youtube_video' }],
  googleMyBusiness: [],
  ga4: [],
  rdStation: []
};

const placementLabels: Record<SocialPlacement, string> = {
  instagram_feed: 'Feed',
  instagram_story: 'Story',
  instagram_reels: 'Reels',
  facebook_feed: 'Feed',
  tiktok_video: 'Vídeo',
  linkedin_feed: 'Feed',
  pinterest_pin: 'Pin',
  threads_post: 'Post',
  x_post: 'Post',
  youtube_video: 'Vídeo'
};

const postableProviders: SocialIntegration[] = [
  'instagram',
  'facebook',
  'linkedin',
  'tiktok',
  'pinterest',
  'threads',
  'x',
  'youtube'
];

const oauthEnabledProviders: SocialIntegration[] = ['instagram', 'facebook', 'linkedin'];

const statusLabels: Record<SocialStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  published: 'Publicado',
  error: 'Erro'
};

const statusClasses: Record<SocialStatus, string> = {
  draft: 'bg-slate-100 text-slate-600',
  scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
  error: 'bg-rose-100 text-rose-600'
};

const toDateKey = (date: Date) => date.toLocaleDateString('sv-SE');

const getPostDateKey = (post: SocialPost) => {
  const rawDate = post.scheduledAt ?? post.publishedAt;
  if (!rawDate) {
    return null;
  }
  return toDateKey(new Date(rawDate));
};

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : 'Sem data';

const formatTime = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    : '';

const SocialManager: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SocialSection>('connections');
  const [connections, setConnections] = useState<SocialAccountConnection[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [mediaLibrary, setMediaLibrary] = useState<SocialMediaItem[]>([]);
  const [reportKpis, setReportKpis] = useState<SocialKpi[]>([]);
  const [networkSummaries, setNetworkSummaries] = useState<SocialNetworkSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedChannels, setSelectedChannels] = useState<SelectedChannel[]>([
    { provider: 'instagram', placements: ['instagram_feed'] },
    { provider: 'facebook', placements: ['facebook_feed'] }
  ]);
  const [postText, setPostText] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState<string | undefined>(undefined);
  const [postHashtags, setPostHashtags] = useState('');
  const [postLink, setPostLink] = useState('');
  const [postCta, setPostCta] = useState('Nenhum');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const mediaFiles = useMemo<MediaFile[]>(
    () => [
      ...mediaLibrary.map((item) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        url: item.url
      })),
      { id: 'doc-01', name: 'Guia de marca IVILAR', type: 'document' }
    ],
    [mediaLibrary]
  );
  const [advancedSettings, setAdvancedSettings] = useState<
    Partial<Record<SocialIntegration, Partial<Record<AdvancedSettingKey, boolean>>>>
  >({});
  const [openSettingsProvider, setOpenSettingsProvider] = useState<SocialIntegration | null>(
    null
  );
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);

  const [calendarProvider, setCalendarProvider] = useState<'all' | SocialIntegration>(
    'all'
  );
  const [calendarStatus, setCalendarStatus] = useState<'all' | SocialStatus>('all');
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(
    toDateKey(new Date())
  );

  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [mediaSearch, setMediaSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [uploadUrl, setUploadUrl] = useState('');

  const [timelineProvider, setTimelineProvider] = useState<'all' | SocialIntegration>(
    'all'
  );
  const [timelineStatus, setTimelineStatus] = useState<'all' | SocialStatus>('all');
  const [timelinePeriod, setTimelinePeriod] = useState<'today' | '7' | '30' | 'all'>(
    '30'
  );

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [connectionsData, postsData, mediaData, reports] = await Promise.all([
          socialService.getConnections(),
          socialService.getPosts(),
          socialService.getMedia(),
          socialService.getReports(30)
        ]);
        if (!active) return;
        setConnections(connectionsData);
        setPosts(postsData);
        setMediaLibrary(mediaData);
        setReportKpis(reports.kpis);
        setNetworkSummaries(reports.networkSummaries);
        setPostMediaUrl((prev) => prev ?? mediaData[0]?.url);
        const nextSettings: Partial<
          Record<SocialIntegration, Partial<Record<AdvancedSettingKey, boolean>>>
        > = {};
        connectionsData.forEach((connection) => {
          if (connection.settings) {
            nextSettings[connection.provider] = connection.settings as Partial<
              Record<AdvancedSettingKey, boolean>
            >;
          }
        });
        setAdvancedSettings(nextSettings);
      } catch (loadError) {
        if (!active) return;
        console.error('Social data load failed:', loadError);
        setError('Nao foi possivel carregar os dados de redes sociais.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const refreshReports = async () => {
    try {
      const reports = await socialService.getReports(30);
      setReportKpis(reports.kpis);
      setNetworkSummaries(reports.networkSummaries);
    } catch (refreshError) {
      console.error('Social reports refresh failed:', refreshError);
    }
  };

  const selectedProviders = useMemo(
    () => selectedChannels.map((channel) => channel.provider),
    [selectedChannels]
  );

  const mediaCounts = useMemo(() => {
    return mediaFiles.reduce(
      (acc, file) => {
        acc[file.type] += 1;
        return acc;
      },
      { image: 0, video: 0, document: 0 }
    );
  }, [mediaFiles]);

  const postActions = [
    { id: 'shorten', label: 'Cortar URL', icon: Scissors },
    { id: 'hashtag', label: 'Adicionar hashtag', icon: Hash },
    { id: 'signature', label: 'Adicionar assinatura', icon: PenLine },
    { id: 'repost', label: 'Repost do Instagram', icon: Repeat },
    { id: 'poll', label: 'Enquete', icon: BarChart2 }
  ];

  const advancedSettingsOptions: { key: AdvancedSettingKey; label: string }[] = [
    { key: 'instagram_shop', label: 'Instagram shop' },
    { key: 'location', label: 'Localização' },
    { key: 'first_comment', label: 'Primeiro comentário' },
    { key: 'disable_comments', label: 'Desativar comentários' },
    { key: 'people_tag', label: 'Marcação de pessoas' }
  ];

  const handleToggleConnection = async (provider: SocialIntegration) => {
    if (!oauthEnabledProviders.includes(provider)) {
      alert('Integracao OAuth ainda nao configurada para esta rede.');
      return;
    }

    const connection = connections.find((item) => item.provider === provider);
    const isConnected = connection?.status === 'connected';

    if (isConnected && connection) {
      const confirmed = window.confirm('Deseja desconectar esta rede?');
      if (!confirmed) {
        return;
      }
      try {
        const updated = await socialService.disconnectProvider(provider);
        setConnections((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
      } catch (disconnectError) {
        console.error('Social connection disconnect failed:', disconnectError);
        alert('Nao foi possivel desconectar a rede.');
      }
      return;
    }

    const returnTo = window.location.href;
    const connectUrl = `${API_BASE_URL}/social/oauth/${provider}/start?returnTo=${encodeURIComponent(
      returnTo
    )}`;
    window.location.href = connectUrl;
  };

  const toggleChannel = (provider: SocialIntegration) => {
    setSelectedChannels((prev) => {
      const existing = prev.find((channel) => channel.provider === provider);
      if (existing) {
        return prev.filter((channel) => channel.provider !== provider);
      }
      const defaults = placementOptions[provider] ?? [];
      return [
        ...prev,
        {
          provider,
          placements: defaults.length > 0 ? [defaults[0].value] : []
        }
      ];
    });
  };

  const togglePlacement = (provider: SocialIntegration, placement: SocialPlacement) => {
    setSelectedChannels((prev) =>
      prev.map((channel) => {
        if (channel.provider !== provider) {
          return channel;
        }
        const exists = channel.placements.includes(placement);
        const nextPlacements = exists
          ? channel.placements.filter((item) => item !== placement)
          : [...channel.placements, placement];
        return {
          ...channel,
          placements: nextPlacements.length > 0 ? nextPlacements : channel.placements
        };
      })
    );
  };

  const handlePostAction = (action: string) => {
    // TODO: implementar ação real (encurtador, hashtags, assinatura, repost, enquete)
    console.log(`TODO: ação rápida do post - ${action}`);
  };

  const buildScheduleIso = () => {
    if (!scheduledDate || !scheduledTime) {
      return undefined;
    }
    const [year, month, day] = scheduledDate.split('-').map(Number);
    const [hours, minutes] = scheduledTime.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes).toISOString();
  };

  const handleCreatePost = async (status: SocialStatus) => {
    if (selectedProviders.length === 0) {
      alert('Selecione ao menos uma rede para publicar o post.');
      return;
    }

    if (status !== 'draft') {
      const unsupported = selectedProviders.filter(
        (provider) => !oauthEnabledProviders.includes(provider)
      );
      if (unsupported.length > 0) {
        alert(
          `Estas redes ainda nao estao prontas para publicar: ${unsupported.join(', ')}.`
        );
        return;
      }

      const disconnected = selectedProviders.filter((provider) => {
        const connection = connections.find((item) => item.provider === provider);
        return !connection || connection.status !== 'connected';
      });
      if (disconnected.length > 0) {
        alert(
          `Conecte as redes antes de publicar: ${disconnected.join(', ')}.`
        );
        return;
      }
    }

    if (status === 'scheduled' && !scheduledDate) {
      alert('Informe a data do agendamento.');
      return;
    }

    const nowIso = new Date().toISOString();
    const scheduleIso = status === 'scheduled' ? buildScheduleIso() : nowIso;

    const mediaItem = postMediaUrl
      ? mediaLibrary.find((item) => item.url === postMediaUrl)
      : undefined;

    try {
      const created = await socialService.createPost({
        text: postText || 'Post sem texto.',
        mediaUrl: postMediaUrl,
        mediaId: mediaItem?.id,
        providers: selectedProviders,
        status,
        scheduledAt: status === 'scheduled' ? scheduleIso : undefined,
        publishedAt: status === 'published' ? nowIso : undefined,
        hashtags: postHashtags,
        link: postLink,
        cta: postCta,
        placements: selectedChannels
      });

      setPosts((prev) => [created, ...prev]);
      if (mediaItem) {
        setMediaLibrary((prev) =>
          prev.map((item) =>
            item.id === mediaItem.id
              ? { ...item, usageCount: item.usageCount + 1 }
              : item
          )
        );
      }
      setPostText('');
      setPostHashtags('');
      setPostLink('');
      setPostCta('Nenhum');
      await refreshReports();
    } catch (createError) {
      console.error('Social post create failed:', createError);
      alert('Nao foi possivel salvar o post.');
    }
  };

  const handleAdvancedSettingToggle = async (
    provider: SocialIntegration,
    setting: AdvancedSettingKey
  ) => {
    const connection = connections.find((item) => item.provider === provider);
    const previous = advancedSettings[provider] ?? {};
    const nextValue = !previous[setting];
    const nextSettings = {
      ...previous,
      [setting]: nextValue
    };
    setAdvancedSettings((prev) => ({
      ...prev,
      [provider]: nextSettings
    }));

    if (!connection) {
      return;
    }

    try {
      const updated = await socialService.updateConnection(connection.id, {
        settings: nextSettings
      });
      setConnections((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (updateError) {
      console.error('Social settings update failed:', updateError);
      setAdvancedSettings((prev) => ({
        ...prev,
        [provider]: previous
      }));
      alert('Nao foi possivel salvar as configuracoes.');
    }
  };

  const handleScheduleAction = async (
    action: 'schedule' | 'schedule_boost' | 'publish_boost' | 'draft'
  ) => {
    if (action === 'draft') {
      await handleCreatePost('draft');
    }
    if (action === 'schedule' || action === 'schedule_boost') {
      await handleCreatePost('scheduled');
    }
    if (action === 'publish_boost') {
      await handleCreatePost('published');
    }
    setShowScheduleMenu(false);
  };

  const handleUploadMedia = async () => {
    if (!uploadName) {
      alert('Informe um nome para a midia.');
      return;
    }
    try {
      const created = await socialService.createMedia({
        name: uploadName,
        type: uploadType,
        url: uploadUrl
      });
      setMediaLibrary((prev) => [created, ...prev]);
      setUploadName('');
      setUploadType('image');
      setUploadUrl('');
      setShowUploadModal(false);
    } catch (uploadError) {
      console.error('Social media upload failed:', uploadError);
      alert('Nao foi possivel enviar a midia.');
    }
  };

  const calendarPosts = useMemo(() => {
    return posts.filter((post) => {
      const postDate = getPostDateKey(post);
      if (!postDate) {
        return false;
      }
      if (calendarProvider !== 'all' && !post.providers.includes(calendarProvider)) {
        return false;
      }
      if (calendarStatus !== 'all' && post.status !== calendarStatus) {
        return false;
      }
      return true;
    });
  }, [posts, calendarProvider, calendarStatus]);

  const calendarPostsByDate = useMemo(() => {
    const map = new Map<string, SocialPost[]>();
    calendarPosts.forEach((post) => {
      const key = getPostDateKey(post);
      if (!key) {
        return;
      }
      map.set(key, [...(map.get(key) ?? []), post]);
    });
    return map;
  }, [calendarPosts]);

  const calendarDays = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekDay = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalCells = 42;
    return Array.from({ length: totalCells }).map((_, index) => {
      const dayNumber = index - startWeekDay + 1;
      const date = new Date(year, month, dayNumber);
      return {
        date,
        label: dayNumber,
        isCurrentMonth: dayNumber > 0 && dayNumber <= daysInMonth,
        key: toDateKey(date)
      };
    });
  }, []);

  const selectedDayPosts = useMemo(() => {
    if (!selectedCalendarDay) {
      return [];
    }
    return calendarPostsByDate.get(selectedCalendarDay) ?? [];
  }, [calendarPostsByDate, selectedCalendarDay]);

  const filteredMedia = useMemo(() => {
    return mediaLibrary.filter((item) => {
      if (mediaFilter !== 'all' && item.type !== mediaFilter) {
        return false;
      }
      if (mediaSearch && !item.name.toLowerCase().includes(mediaSearch.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [mediaLibrary, mediaFilter, mediaSearch]);

  const filteredTimelinePosts = useMemo(() => {
    const now = new Date();
    return [...posts]
      .filter((post) => {
        if (timelineProvider !== 'all' && !post.providers.includes(timelineProvider)) {
          return false;
        }
        if (timelineStatus !== 'all' && post.status !== timelineStatus) {
          return false;
        }

        if (timelinePeriod === 'all') {
          return true;
        }

        const rawDate = post.publishedAt ?? post.scheduledAt;
        if (!rawDate) {
          return false;
        }

        const postDate = new Date(rawDate);
        if (timelinePeriod === 'today') {
          return toDateKey(postDate) === toDateKey(now);
        }
        const diffDays = Math.ceil(
          (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const limit = timelinePeriod === '7' ? 7 : 30;
        return diffDays <= limit;
      })
      .sort((a, b) => {
        const aDate = a.publishedAt ?? a.scheduledAt ?? '';
        const bDate = b.publishedAt ?? b.scheduledAt ?? '';
        return bDate.localeCompare(aDate);
      });
  }, [posts, timelineProvider, timelineStatus, timelinePeriod]);

  const monthLabel = useMemo(() => {
    const now = new Date();
    return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-semibold text-slate-900">
            Gestão de Redes Sociais
          </h3>
          <p className="text-sm text-slate-500">
            Conecte suas contas, agende posts e acompanhe os resultados.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {sectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSection(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${activeSection === tab.id
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
          {error}
        </div>
      )}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
          Carregando dados do social...
        </div>
      )}

      {activeSection === 'connections' && (
        <div className="space-y-5 animate-fade-in">
          <div className="rounded-3xl bg-slate-50 border border-slate-100 p-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 text-slate-700 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <Link2 size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Conecte uma rede social</p>
                  <p className="text-xs text-slate-500">
                    Autorize suas contas com segurança.
                  </p>
                </div>
              </div>
              <ArrowRight className="hidden lg:block text-slate-300" size={18} />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <CalendarCheck size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Agende o primeiro post</p>
                  <p className="text-xs text-slate-500">
                    Planeje seu conteúdo em minutos.
                  </p>
                </div>
              </div>
              <ArrowRight className="hidden lg:block text-slate-300" size={18} />
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-white border border-slate-200 flex items-center justify-center">
                  <BarChart3 size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Analise o desempenho</p>
                  <p className="text-xs text-slate-500">
                    Acompanhe alcance e engajamento.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(providerMeta) as SocialIntegration[]).map((provider) => {
              const connection = connections.find((c) => c.provider === provider);
              const meta = providerMeta[provider];
              const Icon = meta.icon;
              const isConnected = connection?.status === 'connected';
              const isError = connection?.status === 'error';
              const isOAuthEnabled = oauthEnabledProviders.includes(provider);

              return (
                <div
                  key={provider}
                  className="rounded-3xl bg-white shadow-sm border border-slate-100 p-4 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-2xl flex items-center justify-center ${meta.bg} ${meta.text}`}
                      >
                        {meta.isSimpleIcon ? (
                          <SimpleIcon icon={Icon} size={18} className={meta.text} />
                        ) : (
                          <Icon size={18} />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {meta.label}
                        </p>
                        <p className="text-xs text-slate-500">{connection?.name || 'Não conectado'}</p>
                      </div>
                    </div>
                    <span
                      className={`text-[0.6875rem] font-semibold px-2 py-0.5 rounded-full ${isConnected
                        ? 'bg-emerald-50 text-emerald-600'
                        : isError
                          ? 'bg-rose-50 text-rose-600'
                          : 'bg-slate-100 text-slate-500'
                        }`}
                    >
                      {isConnected
                        ? 'Conectado'
                        : isError
                          ? 'Erro'
                          : 'Desconectado'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleConnection(provider)}
                    disabled={!isOAuthEnabled}
                    className={`w-full rounded-full px-3 py-2 text-xs font-semibold transition ${isConnected
                      ? 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      : isError
                        ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                      } ${!isOAuthEnabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {!isOAuthEnabled
                      ? 'Em breve'
                      : isConnected
                        ? 'Desconectar'
                        : isError
                          ? 'Reconectar'
                          : 'Conectar'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 animate-fade-in">
          <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 space-y-5">
            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-1">
                2. Selecione canais
              </h4>
              <p className="text-xs text-slate-500">
                Escolha a rede e o formato da publicação.
              </p>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {postableProviders.map((provider) => {
                  const meta = providerMeta[provider];
                  const Icon = meta.icon;
                  const selectedChannel = selectedChannels.find(
                    (channel) => channel.provider === provider
                  );
                  const isSelected = Boolean(selectedChannel);
                  const placements = placementOptions[provider] ?? [];
                  return (
                    <div
                      key={provider}
                      className={`rounded-2xl border px-3 py-3 transition ${isSelected
                        ? 'border-slate-200 bg-slate-50'
                        : 'border-slate-100 bg-white'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleChannel(provider)}
                        className="flex w-full items-center justify-between text-left"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <Icon size={14} className={meta.text} />
                          {meta.label}
                        </span>
                        <span
                          className={`text-[0.6875rem] font-semibold ${isSelected ? 'text-emerald-600' : 'text-slate-400'
                            }`}
                        >
                          {isSelected ? 'Selecionado' : 'Selecionar'}
                        </span>
                      </button>
                      {isSelected && placements.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {placements.map((placement) => {
                            const isPlacementSelected =
                              selectedChannel?.placements.includes(placement.value) ?? false;
                            return (
                              <button
                                key={placement.value}
                                type="button"
                                onClick={() => togglePlacement(provider, placement.value)}
                                className={`rounded-full border px-2.5 py-1 text-[0.6875rem] font-semibold transition ${isPlacementSelected
                                  ? 'bg-slate-900 text-white border-slate-900'
                                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                  }`}
                              >
                                {placement.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-semibold text-slate-900">
                  Texto do post
                </label>
                <span className="text-xs text-slate-400">{postText.length} / 2200</span>
              </div>
              <textarea
                className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200 resize-none"
                placeholder="Escreva a legenda do seu post..."
                value={postText}
                onChange={(event) => setPostText(event.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-900">Mídia</label>
              <p className="text-xs text-slate-500 mt-1">
                {mediaCounts.image} imagens, {mediaCounts.video} vídeos e{' '}
                {mediaCounts.document} documentos
              </p>
              <div className="mt-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4 text-center">
                {postMediaUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <img
                      src={postMediaUrl}
                      alt="Mídia selecionada"
                      className="h-32 w-full max-w-sm rounded-2xl object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setPostMediaUrl(undefined)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      Remover mídia
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <UploadCloud size={20} />
                    <p className="text-xs">
                      Arraste e solte arquivos ou clique para selecionar.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPostMediaUrl(mediaLibrary[0]?.url)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold hover:bg-white"
                    >
                      <ImageIcon size={14} /> Usar mídia da biblioteca
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Hashtags
                </label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="#imoveis #aluguel"
                  value={postHashtags}
                  onChange={(event) => setPostHashtags(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Link / URL</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="https://..."
                  value={postLink}
                  onChange={(event) => setPostLink(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
              {postActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handlePostAction(action.label)}
                  title={action.label}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[0.6875rem] font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  <action.icon size={12} />
                  {action.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600">Call to Action</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                value={postCta}
                onChange={(event) => setPostCta(event.target.value)}
              >
                {['Nenhum', 'Saiba mais', 'Fale conosco', 'Agendar visita', 'Ver catálogo'].map(
                  (option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-900">Agendamento</span>
                <span className="text-xs text-slate-400">Horário de Brasília (GMT-3)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Data</label>
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                    value={scheduledDate}
                    onChange={(event) => setScheduledDate(event.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Hora</label>
                  <input
                    type="time"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                    value={scheduledTime}
                    onChange={(event) => setScheduledTime(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => console.log('TODO: enviar para aprovação')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Enviar para aprovação
              </button>
              <button
                type="button"
                onClick={() => handleCreatePost('published')}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Publicar agora
              </button>
              <div className="relative">
                <div className="inline-flex overflow-hidden rounded-xl border border-slate-900">
                  <button
                    type="button"
                    onClick={() => handleScheduleAction('schedule')}
                    className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
                  >
                    Agendar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleMenu((prev) => !prev)}
                    className="px-2 bg-slate-900 text-white hover:bg-slate-800"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
                {showScheduleMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white shadow-lg p-1 z-10">
                    {[
                      { id: 'schedule', label: 'Agendar' },
                      { id: 'schedule_boost', label: 'Agendar e impulsionar' },
                      { id: 'publish_boost', label: 'Publicar agora e impulsionar' },
                      { id: 'draft', label: 'Salvar como rascunho' }
                    ].map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() =>
                          handleScheduleAction(
                            option.id as
                            | 'schedule'
                            | 'schedule_boost'
                            | 'publish_boost'
                            | 'draft'
                          )
                        }
                        className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5">
            <p className="text-sm font-semibold text-slate-900 mb-3">Pré-visualização</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedChannels.length === 0 ? (
                <p className="text-xs text-slate-500">
                  Selecione canais para visualizar o preview.
                </p>
              ) : (
                selectedChannels.map((channel) => {
                  const meta = providerMeta[channel.provider];
                  const Icon = meta.icon;
                  const placementText =
                    channel.placements.length > 0
                      ? channel.placements
                        .map((placement) => placementLabels[placement] ?? placement)
                        .join(', ')
                      : 'Sem formato';
                  return (
                    <div key={channel.provider} className="relative">
                      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600">
                        <Icon size={12} className={meta.text} />
                        {meta.label}
                        <span className="text-[0.625rem] text-slate-400">{placementText}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSettingsProvider((prev) =>
                              prev === channel.provider ? null : channel.provider
                            )
                          }
                          className="text-slate-500 hover:text-slate-800"
                        >
                          <Settings size={12} />
                        </button>
                      </div>
                      {openSettingsProvider === channel.provider && (
                        <div className="absolute left-0 mt-2 w-48 rounded-xl border border-slate-100 bg-white shadow-lg p-1 z-10">
                          {advancedSettingsOptions.map((option) => (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() =>
                                handleAdvancedSettingToggle(channel.provider, option.key)
                              }
                              className="w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-between"
                            >
                              <span>{option.label}</span>
                              {advancedSettings[channel.provider]?.[option.key] && (
                                <span className="text-[0.625rem] text-emerald-600">
                                  Ativo
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Instagram size={14} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    {selectedProviders.length === 1
                      ? connections.find((item) => item.provider === selectedProviders[0])
                        ?.name || providerMeta[selectedProviders[0]].label
                      : 'Multi-post'}
                  </p>
                  <p className="text-[0.6875rem] text-slate-500">
                    {selectedProviders.length === 1
                      ? providerMeta[selectedProviders[0]].label
                      : 'Múltiplas redes'}
                  </p>
                </div>
              </div>
              <div className="bg-slate-100 flex items-center justify-center aspect-square text-slate-400">
                {postMediaUrl ? (
                  <img
                    src={postMediaUrl}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon size={32} />
                )}
              </div>
              <div className="px-3 py-3">
                <p className="text-xs font-semibold text-slate-900">12 curtidas</p>
                <p className="mt-1 text-xs text-slate-700">
                  <span className="font-semibold">novamorada</span>{' '}
                  {postText || 'Sua legenda aparecerá aqui.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'calendar' && (
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Calendário</h4>
              <p className="text-xs text-slate-500">
                Visualize postagens agendadas e publicadas em {monthLabel}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                value={calendarProvider}
                onChange={(event) =>
                  setCalendarProvider(event.target.value as 'all' | SocialIntegration)
                }
              >
                <option value="all">Todas as redes</option>
                {postableProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {providerMeta[provider].label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                value={calendarStatus}
                onChange={(event) =>
                  setCalendarStatus(event.target.value as 'all' | SocialStatus)
                }
              >
                <option value="all">Todos os status</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 text-[0.6875rem] text-slate-500 font-semibold">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((label) => (
              <span key={label} className="text-center">
                {label}
              </span>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const count = calendarPostsByDate.get(day.key)?.length ?? 0;
              const isSelected = selectedCalendarDay === day.key;
              return (
                <button
                  key={`${day.key}-${day.label}`}
                  type="button"
                  onClick={() => setSelectedCalendarDay(day.key)}
                  className={`min-h-[72px] rounded-2xl border px-2 py-2 text-xs text-left transition ${day.isCurrentMonth
                    ? 'border-slate-100 bg-white'
                    : 'border-transparent bg-slate-50 text-slate-300'
                    } ${isSelected ? 'ring-2 ring-slate-200' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{day.label > 0 ? day.label : ''}</span>
                    {count > 0 && (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.625rem] font-semibold text-emerald-700">
                        {count}
                      </span>
                    )}
                  </div>
                  {count > 0 && (
                    <div className="mt-2 space-y-1">
                      {(calendarPostsByDate.get(day.key) ?? []).slice(0, 2).map((post) => (
                        <div
                          key={post.id}
                          className="truncate text-[0.625rem] text-slate-500"
                        >
                          {post.text}
                        </div>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">
              Posts do dia {selectedCalendarDay}
            </p>
            {selectedDayPosts.length === 0 ? (
              <p className="text-xs text-slate-500">
                Nenhuma publicação encontrada para este dia.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayPosts.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">{formatTime(post.scheduledAt)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[0.625rem] font-semibold ${statusClasses[post.status]}`}
                      >
                        {statusLabels[post.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-700 line-clamp-2">{post.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'library' && (
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Biblioteca de Mídia</h4>
              <p className="text-xs text-slate-500">
                Centralize imagens e vídeos usados nas campanhas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Plus size={14} /> Enviar mídia
            </button>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'Todas', icon: ImageIcon },
                { id: 'image', label: 'Imagens', icon: ImageIcon },
                { id: 'video', label: 'Vídeos', icon: Video }
              ].map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setMediaFilter(filter.id as 'all' | 'image' | 'video')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${mediaFilter === filter.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                >
                  <filter.icon size={12} /> {filter.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                placeholder="Buscar mídia pelo nome..."
                value={mediaSearch}
                onChange={(event) => setMediaSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-white overflow-hidden"
              >
                <div className="aspect-video bg-slate-100 flex items-center justify-center">
                  {item.url ? (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon size={24} className="text-slate-400" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="text-[0.6875rem] text-slate-500">
                    {item.type === 'image' ? 'Imagem' : 'Vídeo'} •{' '}
                    {new Date(item.uploadedAt).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="mt-2 text-[0.6875rem] text-slate-500">
                    Usada em {item.usageCount} post(s)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSection === 'timeline' && (
        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-900">
                Timeline de Publicações
              </h4>
              <p className="text-xs text-slate-500">
                Acompanhe posts publicados, agendados e rascunhos.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                value={timelineProvider}
                onChange={(event) =>
                  setTimelineProvider(event.target.value as 'all' | SocialIntegration)
                }
              >
                <option value="all">Todas as redes</option>
                {postableProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {providerMeta[provider].label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                value={timelineStatus}
                onChange={(event) =>
                  setTimelineStatus(event.target.value as 'all' | SocialStatus)
                }
              >
                <option value="all">Todos os status</option>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <select
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                value={timelinePeriod}
                onChange={(event) =>
                  setTimelinePeriod(event.target.value as 'today' | '7' | '30' | 'all')
                }
              >
                <option value="today">Hoje</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
                <option value="all">Tudo</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filteredTimelinePosts.map((post) => (
              <div
                key={post.id}
                className="rounded-2xl border border-slate-100 bg-white px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2 text-[0.6875rem] text-slate-500">
                  <div className="flex items-center gap-1">
                    {post.providers.map((provider) => {
                      const meta = providerMeta[provider];
                      const Icon = meta.icon;
                      return (
                        <Icon
                          key={`${post.id}-${provider}`}
                          size={12}
                          className={meta.text}
                        />
                      );
                    })}
                  </div>
                  <span>
                    {formatDate(post.publishedAt ?? post.scheduledAt)}{' '}
                    {formatTime(post.publishedAt ?? post.scheduledAt)}
                  </span>
                  <span
                    className={`ml-auto px-2 py-0.5 rounded-full text-[0.625rem] font-semibold ${statusClasses[post.status]}`}
                  >
                    {statusLabels[post.status]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-800">{post.text}</p>
                {post.mediaUrl && (
                  <img
                    src={post.mediaUrl}
                    alt="Mídia do post"
                    className="mt-3 rounded-2xl h-40 w-full object-cover"
                  />
                )}
                <div className="mt-3 flex flex-wrap gap-4 text-[0.6875rem] text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Heart size={12} /> {post.metrics?.likes ?? 0} curtidas
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle size={12} /> {post.metrics?.comments ?? 0} comentários
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Share2 size={12} /> {post.metrics?.shares ?? 0} compartilhamentos
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye size={12} /> {post.metrics?.views ?? 0} visualizações
                  </span>
                </div>
              </div>
            ))}
            {filteredTimelinePosts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center text-xs text-slate-500">
                Nenhuma publicação encontrada para os filtros selecionados.
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'reports' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {reportKpis.map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-3xl bg-white shadow-sm border border-slate-100 p-4"
              >
                <p className="text-xs font-semibold text-slate-500">{kpi.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{kpi.value}</p>
                <p className="mt-1 text-[0.6875rem] text-slate-400">{kpi.hint}</p>
              </div>
            ))}
          </div>
          <div className="rounded-3xl bg-white shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900">
                Resumo por rede
              </h4>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-5 py-3 text-left">Rede</th>
                  <th className="px-5 py-3 text-left">Posts</th>
                  <th className="px-5 py-3 text-left">Alcance</th>
                  <th className="px-5 py-3 text-left">Engajamento</th>
                  <th className="px-5 py-3 text-left">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {networkSummaries.map((summary) => {
                  const meta = providerMeta[summary.provider];
                  const Icon = meta.icon;
                  return (
                    <tr key={summary.provider}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Icon size={14} className={meta.text} />
                          {meta.label}
                        </div>
                      </td>
                      <td className="px-5 py-3">{summary.posts}</td>
                      <td className="px-5 py-3">{summary.reach.toLocaleString()}</td>
                      <td className="px-5 py-3">
                        {summary.engagement.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">{summary.ctr.toFixed(1)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Enviar mídia</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nome</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="Ex: Fachada empreendimento"
                  value={uploadName}
                  onChange={(event) => setUploadName(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Tipo</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                  value={uploadType}
                  onChange={(event) => setUploadType(event.target.value as 'image' | 'video')}
                >
                  <option value="image">Imagem</option>
                  <option value="video">Vídeo</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">URL (opcional)</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-200"
                  placeholder="https://..."
                  value={uploadUrl}
                  onChange={(event) => setUploadUrl(event.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUploadMedia}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800"
              >
                Salvar mídia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialManager;
