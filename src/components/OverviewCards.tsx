import { JSX, ReactNode } from "react";

interface Props {
  text: string;
  icon: JSX.Element;
  children: ReactNode;
  className?: string;
}
export const OverviewCards = ({ text, icon, children, className }: Props) => {
  return (
    <div className={`bg-white px-5 pt-4 pb-5 mb-2 rounded-xl text-base ${className}`}>
      <div className="flex item-center font-medium mb-1 text-black/90">
        <div className="">{icon}</div>
        <h3 className="ml-2">{text}</h3>
      </div>
      <div className="text-black/80">{children}</div>
    </div>
  );
};
