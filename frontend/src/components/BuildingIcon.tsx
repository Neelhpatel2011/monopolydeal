import houseSvg from "../assets/house_svg.svg";
import hotelSvg from "../assets/hotel_svg.svg";

type BuildingIconProps = {
  building: "House" | "Hotel";
  className?: string;
};

export function BuildingIcon({ building, className }: BuildingIconProps) {
  return (
    <img
      className={className}
      src={building === "House" ? houseSvg : hotelSvg}
      alt=""
      aria-hidden="true"
    />
  );
}
