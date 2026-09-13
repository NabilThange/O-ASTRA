"use client";
import "@/styles/revbtn.css";

interface AnimateBtnProps {
  btnName: string;
}

const AnimateBtn = ({ btnName }: AnimateBtnProps) => {
  return (
    <div className="link-line">
      <div className="rev-link rev-top text-[12px]">{btnName}</div>
      <div className="rev-link text-[12px]">{btnName}</div>
    </div>
  );
};

export default AnimateBtn;
