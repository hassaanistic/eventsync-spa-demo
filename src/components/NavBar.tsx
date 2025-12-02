"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/pdp", label: "PDP" },
  { href: "/contact", label: "Contact" },
];

const NavBar = () => {
  const pathname = usePathname();

  return (
    <header className="nav-bar">
      <span className="nav-logo">EventsIQ SPA</span>
      <nav className="nav-links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={pathname === link.href ? "active" : ""}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default NavBar;
