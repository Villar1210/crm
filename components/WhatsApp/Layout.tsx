import React, { useState } from 'react';
import { MessageCircle, Settings, Users, CircleDashed } from 'lucide-react';

const SidebarNav = ({ activeModule, setActiveModule, onConfig }: any) => {
    // Top Icons (Chats, Status, Channels, Communities)
    const topIcons = [
        { id: 'chat', icon: MessageCircle, title: 'Conversas' },
        { id: 'status', icon: CircleDashed, title: 'Status' },
        { id: 'communities', icon: Users, title: 'Comunidades' },
    ];

    return (
        <div className="w-[60px] bg-[#f0f2f5] border-r border-[#d1d7db] flex flex-col items-center py-3 justify-between pb-4">
            <div className="flex flex-col items-center gap-2">
                {topIcons.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${activeModule === item.id ? 'bg-[#d9fdd3]' : 'hover:bg-[#e9edef]'}`}
                        title={item.title}
                    >
                        <item.icon className={`w-6 h-6 ${activeModule === item.id ? 'text-[#008069]' : 'text-[#54656f]'}`} strokeWidth={activeModule === item.id ? 2.5 : 2} />
                    </button>
                ))}
            </div>

            <div className="flex flex-col items-center gap-3 text-[#54656f]">
                <button onClick={onConfig} className="w-10 h-10 hover:bg-[#e9edef] rounded-full flex items-center justify-center">
                    <Settings className="w-6 h-6" />
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer">
                    <img src="https://i.pravatar.cc/150?u=admin" alt="Profile" />
                </div>
            </div>
        </div>
    );
};

interface WhatsAppLayoutProps {
    children: React.ReactNode;
    onConfig: () => void;
}

export const WhatsAppLayout: React.FC<WhatsAppLayoutProps> = ({ children, onConfig }) => {
    const [activeModule, setActiveModule] = useState('chat');

    return (
        <div className="flex w-full h-[calc(100vh-2rem)] bg-white overflow-hidden font-sans border border-gray-300 xl:mx-auto xl:max-w-[1600px] xl:my-4 shadow-lg xl:shadow-none shadow-gray-300">
            {/* Main Background for larger screens usually has a green strip, but inside the component we focus on the app interface */}
            <div className="flex-1 flex overflow-hidden bg-[#fff]">
                <SidebarNav activeModule={activeModule} setActiveModule={setActiveModule} onConfig={onConfig} />
                {children}
            </div>
        </div>
    );
};
