import { IconSupport, IconCommunity, IconShield } from "./icons";

export const SupportLinksSection = (): JSX.Element => {
    const supportLinks = [
        {
            id: 1,
            label: "Suporte",
            icon: <IconSupport />,
            textSize: "text-base",
        },
        {
            id: 2,
            label: "Comunidade",
            icon: <IconCommunity />,
            textSize: "text-[15.9px]",
        },
        {
            id: 3,
            label: "Central de confiança",
            icon: <IconShield />,
            textSize: "text-base",
        },
    ];

    return (
        <section className="flex flex-col items-start px-[312.5px] py-1 relative self-stretch w-full flex-[0_0_auto]">
            <div className="flex max-w-screen-xl items-start justify-between relative w-full flex-[0_0_auto] bg-[#f7f6f7]">
                <div className="inline-flex flex-col max-w-screen-sm items-start justify-center px-0 py-3 relative flex-[0_0_auto] self-stretch">
                    <div className="inline-flex flex-col max-w-screen-sm items-start gap-[18px] pl-0 pr-[5.67px] pt-[17.5px] pb-[24.5px] relative flex-1 grow">
                        <p className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Regular',Helvetica] font-normal text-[#130032] text-[15.6px] tracking-[0] leading-6">
                            Quer participar de estudos de pesquisa da Docusign, como
                            pesquisas, entrevistas e testes
                            <br />
                            de ideias para novos produtos e recursos?
                        </p>

                        <div className="relative flex-[0_0_auto] inline-flex items-start">
                            <a
                                href="#"
                                className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Regular',Helvetica] font-normal text-[#260559] text-[15.6px] tracking-[0] leading-6 whitespace-nowrap hover:underline focus:outline-none focus:ring-2 focus:ring-[#260559] focus:ring-offset-2"
                                aria-label="Participe do Painel de Pesquisa de Experiência do Produto"
                            >
                                Participe do Painel de Pesquisa de Experiência do Produto
                            </a>
                        </div>
                    </div>
                </div>

                <nav
                    className="inline-flex flex-col max-w-[422.4px] items-start pt-[18px] pb-[50px] px-0 relative flex-[0_0_auto] self-stretch"
                    aria-label="Links de suporte"
                >
                    <ul className="inline-flex flex-col items-start gap-2 relative flex-[0_0_auto] list-none m-0 p-0">
                        {supportLinks.map((link) => (
                            <li
                                key={link.id}
                                className="flex items-center relative self-stretch w-full flex-[0_0_auto]"
                            >
                                <a
                                    href="#"
                                    className="flex items-center group hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#130032] focus:ring-offset-2 rounded"
                                    aria-label={link.label}
                                >
                                    <div className="flex items-center justify-center w-6 h-6 mr-1" aria-hidden="true">
                                        {link.icon}
                                    </div>

                                    <div className="flex-col pl-2 pr-0 py-0 relative flex-[0_0_auto] inline-flex items-start">
                                        <span
                                            className={`relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Regular',Helvetica] font-normal text-[#130032] ${link.textSize} tracking-[0] leading-6 whitespace-nowrap group-hover:underline`}
                                        >
                                            {link.label}
                                        </span>
                                    </div>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
        </section >
    );
};
