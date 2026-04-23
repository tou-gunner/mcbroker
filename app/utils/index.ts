import { FaFile, FaHeartbeat, FaCar, FaHome, FaPlane, FaBusinessTime } from "react-icons/fa";
import { IconType } from "react-icons";

const insuranceLogoMap: Record<string, IconType> = {
    "life": FaHeartbeat,
    "health": FaHeartbeat,
    "accident": FaCar,
    "travel": FaPlane,
    "home": FaHome,
    "car": FaCar,
    "business": FaBusinessTime,
}

export function getInsuranceLogo(insuranceName: string): IconType {
    return insuranceLogoMap[insuranceName.toLowerCase() as keyof typeof insuranceLogoMap] || FaFile;
}