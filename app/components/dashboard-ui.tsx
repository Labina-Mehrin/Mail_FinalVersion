"use client";

import React from "react";

export function GlassCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl",
        "shadow-[0_20px_80px_rgba(0,0,0,0.35)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function StatTile({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-2 text-lg text-white/90">
        {loading ? (
          <span className="inline-block h-5 w-24 animate-pulse rounded bg-white/10" />
        ) : (
          value
        )}
      </div>
    </div>
  );
}

export function FeatureCard({
  href,
  title,
  description,
  accent,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  accent: "purple" | "pink" | "blue" | "green";
  icon: React.ReactNode;
}) {
  const accentClass =
    accent === "purple"
      ? "from-purple-500 to-indigo-500"
      : accent === "pink"
      ? "from-pink-500 to-purple-500"
      : accent === "green"
      ? "from-green-500 to-emerald-500"
      : "from-indigo-500 to-sky-500";

  return (
    <a href={href} className="group block focus:outline-none">
      <div
        className={[
          "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6",
          "transition-all duration-300 hover:bg-white/10 hover:shadow-[0_30px_120px_rgba(0,0,0,0.45)]",
          "group-hover:scale-[1.02] focus-visible:ring-2 focus-visible:ring-purple-300",
        ].join(" ")}
      >
        <div
          className={[
            "mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br",
            accentClass,
            "transition-transform duration-300 group-hover:scale-110",
          ].join(" ")}
        >
          {icon}
        </div>
        <div className="text-lg text-white/95">{title}</div>
        <div className="mt-1 text-sm text-white/60">{description}</div>
        <div className="mt-4 text-sm text-white/70 group-hover:text-white transition">
          Open →
        </div>
      </div>
    </a>
  );
}
