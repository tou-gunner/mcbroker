import { FaPhone } from "react-icons/fa";

export default function Footer() {
    return (
        <div className="w-full bg-[#242424] shadow-sm flex flex-col items-center justify-between lg:px-[10%] xl:px-[15%] p-6">
            <h1 className="text-primary text-4xl font-bold mb-4">ຕິດຕໍ່ພວກເຮົາ</h1>
            <div className="w-full flex align-start justify-center gap-6">
                <div className="grow flex flex-col items-start">
                    <h2 className="text-secondary text-2xl font-bold text-shadow-[1px_1px_0_gray]">ທີ່ຢູ່:</h2>
                    <p>Vientiane, Laos</p>
                </div>
                <div className="grow flex flex-col items-start justify-center">
                    <h2 className="text-secondary text-2xl font-bold text-shadow-[1px_1px_0_gray]">ຕິດຕໍ່:</h2>
                    <p className="flex items-center gap-2"><FaPhone /> ເບີໂທລະສັບຕັ້ງໂຕະ : (+856) +856-21-123456</p>
                    <p className="flex items-center gap-2"><FaPhone /> ເບີໂທລະສັບມືຖື : (+856) +856-21-123456</p>
                </div>
            </div>
        </div>
    );
}