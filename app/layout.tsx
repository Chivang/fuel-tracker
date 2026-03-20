import type { Metadata } from "next";
import { Phetsarath } from "next/font/google"; // ໂຫລດຟອນ Phetsarath ຈາກ Google Fonts
import "./globals.css";

// ຕັ້ງຄ່າຟອນ Phetsarath
const phetsarath = Phetsarath({
  weight: ["400", "700"], // ໂຫລດທັງແບບຕົວທຳມະດາ ແລະ ຕົວເຂັ້ມ
  subsets: ["lao"],     // ມາດຕະຖານ Next.js
  display: "swap",        // ຊ່ວຍໃຫ້ຕົວໜັງສືຂຶ້ນໄວ ໂດຍບໍ່ຕ້ອງລໍຖ້າຟອນໂຫລດດົນ
});

export const metadata: Metadata = {
  title: "Lao Fuel Tracker",
  description: "ລະບົບຕິດຕາມສະຖານະປໍ້ານ້ຳມັນໃນລາວ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lo">
      {/* ນຳໃຊ້ຟອນ Phetsarath ໃສ່ໃນ body ເພື່ອໃຫ້ມີຜົນທັງເວັບໄຊ */}
      <body className={phetsarath.className}>
        {children}
      </body>
    </html>
  );
}