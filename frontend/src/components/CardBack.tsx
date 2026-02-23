export default function CardBack() {
    return (
        <div
            className="
                bg-[var(--color-coral)]
                rounded-md
                w-full h-full
                flex items-center justify-center
                relative overflow-hidden
                border-white border-1
            "
        >

            {/* Center content - readable at small sizes */}
            <div className="
                flex flex-col items-center justify-center
                text-white
                z-10
                px-1
            ">
                <span className="
                    text-[0.5rem] font-black
                    tracking-wide
                ">
                    BLACKROCK
                </span>
                <span className="
                    text-[0.4rem] font-bold
                    tracking-wider
                ">
                    DEAL
                </span>
            </div>

            {/* Subtle diagonal line pattern */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 6px)'
                }}
            />
        </div>
    )
}