import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./header";
import Menu from "./menu";

export default function DefaultLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      <Menu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        collapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
      />
      <div
        className={`min-h-screen bg-(--color-surface) transition-all duration-300 ${isCollapsed ? "xl:ml-[72px]" : "xl:ml-[240px]"}`}
      >
        <Header onMenuToggle={() => setIsMenuOpen((prev) => !prev)} />
        <main className="px-4 pb-6 pt-4 md:px-6">
          <Outlet />
        </main>
      </div>
    </>
  );
}
