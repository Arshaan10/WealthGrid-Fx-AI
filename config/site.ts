export const nav = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/packages", label: "Packages" },
  { href: "/rewards", label: "Rewards" },
  { href: "/ranks", label: "Ranks" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const userNav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/wallets", label: "Wallets" },
  { href: "/dashboard/package", label: "Activate package" },
  { href: "/dashboard/deposit", label: "Deposit" },
  { href: "/dashboard/withdraw", label: "Withdraw" },
  { href: "/dashboard/referrals", label: "Referrals" },
  { href: "/dashboard/rewards", label: "Rewards" },
  { href: "/dashboard/profile", label: "Profile" },
] as const;

export const adminNav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/treasury", label: "Treasury" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/packages", label: "Packages" },
  { href: "/admin/queue", label: "Deposit queue" },
  { href: "/admin/rewards", label: "Reward config" },
  { href: "/admin/ranks", label: "Ranks" },
  { href: "/admin/announcements", label: "Announcements" },
  { href: "/admin/audit", label: "Audit log" },
] as const;
