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

function pad2(n: number): string {
    return n < 10 ? `0${n}` : String(n);
}

export function formatDate(input: string | Date | null | undefined): string {
    if (input === null || input === undefined || input === '') return '';
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateTime(input: string | Date | null | undefined): string {
    if (input === null || input === undefined || input === '') return '';
    const d = input instanceof Date ? input : new Date(input);
    if (isNaN(d.getTime())) return '';
    return `${formatDate(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}