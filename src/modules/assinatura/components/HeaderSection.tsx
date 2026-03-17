import { useState } from "react";
import { IconMenu, IconHelp, DocusignLogo } from "./icons";

export const HeaderSection = (): JSX.Element => {
    const [activeTab, setActiveTab] = useState(0);

    const navigationTabs = [
        { id: 0, label: "Não se trata de uma questão de...", fontSize: "15.1px" },
        { id: 1, label: "Acordos", fontSize: "14.8px" },
        { id: 2, label: "Modelos", fontSize: "15px" },
        { id: 3, label: "Relatórios", fontSize: "14.9px" },
        { id: 4, label: "Administrador", fontSize: "15.1px" },
    ];

    return (
        <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] bg-[#4c00fb]">
            <header className="flex h-16 items-start justify-between px-4 py-0 relative self-stretch w-full bg-white [border-top-style:none] [border-right-style:none] border-b [border-bottom-style:solid] [border-left-style:none] border-[#1300321a]">
                <div className="inline-flex items-center gap-10 pl-2.5 pr-0 py-0 relative self-stretch flex-[0_0_auto]">
                    <div className="flex items-center gap-1.5 grayscale mr-2">
                        <DocusignLogo />
                        <span className="font-bold text-[#260559] text-lg uppercase tracking-wider">Docusign</span>
                    </div>

                    <nav
                        className="inline-flex flex-col items-start relative flex-[0_0_auto] mt-[-0.50px] mb-[-0.50px]"
                        aria-label="Main navigation"
                    >
                        <div className="inline-flex items-start relative flex-[0_0_auto]">
                            {navigationTabs.map((tab) => (
                                <div
                                    key={tab.id}
                                    className="inline-flex flex-col items-start relative self-stretch flex-[0_0_auto]"
                                >
                                    {tab.id === 0 ? (
                                        <div className="inline-flex h-16 items-center px-6 py-px relative">
                                            <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                                                <p
                                                    className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Bold',Helvetica] font-bold text-[#130032e6] text-center tracking-[0] leading-6 whitespace-nowrap"
                                                    style={{ fontSize: tab.fontSize }}
                                                >
                                                    {tab.label}
                                                </p>
                                            </div>
                                            <div className="absolute w-full left-0 bottom-0 h-[3px] bg-[#130032]" />
                                        </div>
                                    ) : (
                                        <button
                                            className="all-[unset] box-border inline-flex h-16 items-center px-6 py-px relative"
                                            onClick={() => setActiveTab(tab.id)}
                                            aria-current={activeTab === tab.id ? "page" : undefined}
                                        >
                                            <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                                                <div
                                                    className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Bold',Helvetica] font-bold text-[#130032b2] text-center tracking-[0] leading-6 whitespace-nowrap"
                                                    style={{ fontSize: tab.fontSize }}
                                                >
                                                    {tab.label}
                                                </div>
                                            </div>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </nav>
                </div>

                <div className="relative self-stretch w-4" />

                <div className="inline-flex items-center justify-end relative self-stretch flex-[0_0_auto]">
                    <div className="inline-flex items-center relative flex-[0_0_auto]">
                        <div className="inline-flex flex-col items-start pl-0 pr-4 py-0 relative flex-[0_0_auto]">
                            <div className="relative w-fit mt-[-1.00px] text-[#260559] text-[15.9px] leading-6 flex items-center justify-center [font-family:'Arial-Regular',Helvetica] font-normal tracking-[0] whitespace-nowrap">
                                10 dias restantes
                            </div>
                        </div>

                        <button className="all-[unset] box-border inline-flex min-w-20 min-h-8 items-center justify-center pt-[5.2px] pb-[5.21px] px-2 relative flex-[0_0_auto] bg-[#260559] rounded-full border border-solid border-transparent">
                            <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                                <div className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Regular',Helvetica] font-normal text-white text-[13.9px] text-center tracking-[0] leading-[19.6px] whitespace-nowrap">
                                    Exibir planos
                                </div>
                            </div>
                        </button>
                    </div>

                    <div className="inline-flex flex-col items-start pl-3 pr-0 py-0 relative flex-[0_0_auto] mt-[-0.50px] mb-[-0.50px]">
                        <button
                            className="all-[unset] box-border inline-flex h-16 items-center px-3 py-0 relative"
                            aria-label="Notifications"
                        >
                            <div className="inline-flex items-start relative flex-[0_0_auto]">
                                <IconMenu />
                            </div>
                        </button>
                    </div>

                    <div className="inline-flex flex-col items-start relative flex-[0_0_auto] mt-[-0.50px] mb-[-0.50px]">
                        <button
                            className="all-[unset] box-border inline-flex h-16 items-center px-3 py-0 relative"
                            aria-label="Help"
                        >
                            <div className="inline-flex items-start relative flex-[0_0_auto]">
                                <IconHelp />
                            </div>
                        </button>
                    </div>

                    <div className="inline-flex flex-col items-start relative flex-[0_0_auto] mt-[-0.50px] mb-[-0.50px]">
                        <button
                            className="all-[unset] box-border inline-flex flex-col items-center justify-center p-3 relative flex-[0_0_auto]"
                            aria-label="User profile"
                        >
                            <div className="inline-flex items-start justify-center relative flex-[0_0_auto]">
                                <div className="flex w-10 items-center justify-center pt-[9.48px] pb-[9.49px] px-0 relative bg-[#caf4fc] rounded-full overflow-hidden">
                                    <div className="inline-flex flex-col items-center pt-[0.54px] pb-[0.49px] px-0 relative flex-[0_0_auto]">
                                        <div className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Regular',Helvetica] font-normal text-[#035a6c] text-[15.6px] text-center tracking-[-0.16px] leading-5 whitespace-nowrap">
                                            CM
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                <div className="flex items-start justify-center px-0 py-[18px] relative self-stretch w-full flex-[0_0_auto] bg-[#63607c]">
                    <div className="flex w-[800px] items-center justify-center gap-[18px] relative self-stretch">
                        <div className="flex flex-col w-[153.97px] items-start relative ml-[-0.06px]">
                            <div className="relative flex items-center justify-center w-fit mt-[-1.00px] mr-[-0.03px] [font-family:'Arial-Regular',Helvetica] font-normal text-white text-[23.8px] tracking-[-0.24px] leading-[30px] whitespace-nowrap">
                                Comece agora
                            </div>
                        </div>

                        <div className="w-20 h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div className="w-1/2 h-full bg-white rounded-full"></div>
                        </div>

                        <button className="all-[unset] box-border inline-flex flex-col items-center justify-center px-1.5 py-px relative flex-[0_0_auto]">
                            <div className="inline-flex items-start justify-center relative flex-[0_0_auto]">
                                <div className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Regular',Helvetica] font-normal text-white text-[15.8px] text-center tracking-[0] leading-6 whitespace-nowrap">
                                    2/4 ações concluídas
                                </div>
                            </div>
                        </button>

                        <div className="flex flex-col w-[159.52px] items-start relative">
                            <div className="relative flex items-center justify-center w-fit mt-[-1.00px] mr-[-0.48px] [font-family:'Arial-Regular',Helvetica] font-normal text-white text-[15.5px] tracking-[0] leading-6 whitespace-nowrap">
                                Qual o próximo passo?
                            </div>
                        </div>

                        <div className="flex flex-col max-w-[235px] w-[166.38px] items-start relative mr-[-0.06px]">
                            <button className="all-[unset] box-border inline-flex min-w-20 min-h-10 items-center justify-center px-3 py-[7px] relative flex-[0_0_auto] rounded border border-solid border-[#ffffff80]">
                                <div className="inline-flex flex-col items-center relative flex-[0_0_auto]">
                                    <div className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Regular',Helvetica] font-normal text-white text-[15.8px] text-center tracking-[0] leading-6 whitespace-nowrap">
                                        Convide sua equipe
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
