import { useState } from "react";
// import vector13 from "../assets/vector-13.svg";

export const LegalFooterSection = (): JSX.Element => {
    const [selectedLanguage] = useState("Português (Brasil)");

    const footerLinks = [
        { text: "Entre em contato", href: "#contact" },
        { text: "certificado de uso", href: "#certificate" },
        { text: "Ê", href: "#e" },
        { text: "Propriedade intelectual", href: "#intellectual-property" },
        { text: "Confiar", href: "#trust" },
    ];

    return (
        <footer className="flex flex-col items-start px-6 py-[5px] relative self-stretch w-full flex-[0_0_auto] bg-white border-t [border-top-style:solid] [border-right-style:none] [border-bottom-style:none] [border-left-style:none] border-[#cccccc]">
            <div className="flex items-center relative self-stretch w-full flex-[0_0_auto]">
                <div className="inline-flex flex-col items-start px-0 py-2.5 relative flex-[0_0_auto]">
                    <nav
                        className="flex flex-wrap items-center gap-6 relative"
                        aria-label="Footer navigation"
                    >
                        <button
                            className="inline-flex items-center justify-center px-2 py-1 bg-[#1300320d] rounded border border-solid border-transparent hover:bg-[#13003214] focus:outline-none transition-colors"
                            aria-label="Select language"
                        >
                            <span className="[font-family:'Arial-Regular',Helvetica] font-normal text-[#130032e6] text-[10px] tracking-[0] whitespace-nowrap mr-2">
                                {selectedLanguage}
                            </span>
                            <span className="relative w-3 h-2" aria-hidden="true">
                                <svg className="absolute w-full h-full" viewBox="0 0 10 6" fill="none">
                                    <path d="M1 1l4 4 4-4" stroke="#130032" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        </button>

                        <div className="flex items-center gap-2 flex-wrap">
                            {footerLinks.map((link, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <a
                                        href={link.href}
                                        className="[font-family:'Arial-Regular',Helvetica] font-normal text-[#130032e6] text-[10px] tracking-[0] whitespace-nowrap hover:underline focus:outline-none focus:underline"
                                    >
                                        {link.text}
                                    </a>
                                    {index < footerLinks.length - 1 && (
                                        <span className="text-[#1300321a] text-[10px] select-none" aria-hidden="true">
                                            |
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </nav>
                </div>

                <div className="inline-flex flex-col items-start pl-5 pr-0 py-0 relative flex-[0_0_auto] ml-[-5.68e-14px]">
                    <p className="relative flex items-center justify-center w-fit mt-[-1.00px] [font-family:'Arial-Regular',Helvetica] font-normal text-[#130032e6] text-[9.8px] tracking-[0] leading-3 whitespace-nowrap">
                        Copyright © 2026 Docusign, Inc. Todos os direitos reservados
                    </p>
                </div>
            </div>
        </footer>
    );
};
