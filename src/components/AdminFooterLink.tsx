"use client";
import { useRouter } from "next/navigation";

export default function AdminFooterLink() {
  const router = useRouter();

  const handleClick = () => {
    if (window.confirm("관리자 편집 시크릿 버튼을 누르셨습니다. 편집하시겠습니까?")) {
      router.push("/admin");
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-sm font-medium text-gray-500 mb-1 hover:text-gray-700 transition-colors cursor-pointer block w-full"
    >
      중동인의 땀방울을 기록하다.
    </button>
  );
}
