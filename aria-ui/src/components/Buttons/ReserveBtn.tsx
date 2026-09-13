"use client";
import { useRouter } from "next/navigation";
import { MdArrowOutward } from "react-icons/md";
import AnimateBtn from "./AnimateBtn";

const ReserveBtn = () => {
  const router = useRouter();

  return (
    <div className="relative z-49">
      <div 
        className="group absolute right-6 top-[2vw] w-[8.5vw] bg-[#f4efe7] px-1 py-1 flex justify-end items-center rounded-4xl gap-2 cursor-pointer"
        onClick={() => router.push("/dashboard")}
      >
        <AnimateBtn btnName="Try ARIA" />
        <MdArrowOutward className="bg-[#2a2725] text-[#b3a694] w-[2.5vw] h-auto rounded-full p-1" />
      </div>
    </div>
  );
};

export default ReserveBtn;
