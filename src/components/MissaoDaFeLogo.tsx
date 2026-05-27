import Image from "next/image";

type MissaoDaFeLogoProps = {
  size: "header" | "home" | "loading";
  className?: string;
};

const symbolClasses = {
  header: "h-10 w-10",
  home: "h-20 w-20 sm:h-24 sm:w-24",
  loading: "h-16 w-16"
};

const textClasses = {
  header: "text-xl",
  home: "text-4xl sm:text-5xl",
  loading: "text-3xl"
};

export function MissaoDaFeLogo({ size, className = "" }: MissaoDaFeLogoProps) {
  const isHome = size === "home";

  return (
    <div
      className={`flex items-center ${isHome ? "flex-col gap-3" : "gap-2.5"} ${className}`}
      aria-label="Missão da Fé"
    >
      <Image
        src="/missao-da-fe-symbol.png"
        alt="Missão da Fé"
        width={300}
        height={315}
        priority={size !== "header"}
        className={`${symbolClasses[size]} object-contain drop-shadow-[0_10px_22px_rgba(18,53,91,0.18)]`}
      />
      <span
        className={`${textClasses[size]} whitespace-nowrap font-black leading-none tracking-[-0.01em] text-navy`}
      >
        Missão da Fé
      </span>
    </div>
  );
}
