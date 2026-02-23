export default function EmoteButton() {
    return (
        <button
            className="
                border-black border-2
                w-8 h-8 rounded-md bg-white flex items-center justify-center
                hover:brightness-110 active:scale-90 transition-all cursor-pointer
            "
        >
            <div className="flex gap-1 p-2">
                <span className="w-[6px] h-[6px] rounded-full bg-black"></span>
                <span className="w-[6px] h-[6px] rounded-full bg-black"></span>
                <span className="w-[6px] h-[6px] rounded-full bg-black"></span>
            </div>
        </button>
    )
}