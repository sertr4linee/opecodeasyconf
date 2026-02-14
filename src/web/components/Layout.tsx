import { A } from "@solidjs/router";
import type { ParentProps } from "solid-js";

const NAV_ITEMS = [
  { href: "/", label: "MCP Servers", icon: "M" },
  { href: "/providers", label: "Providers", icon: "P" },
  { href: "/skills", label: "Skills", icon: "S" },
  { href: "/agents", label: "Agents", icon: "A" },
] as const;

export default function Layout(props: ParentProps) {
  return (
    <div class="flex h-screen">
      {/* Sidebar */}
      <nav class="w-56 bg-neutral-900 border-r border-neutral-800 flex flex-col">
        <div class="px-4 py-5 border-b border-neutral-800">
          <h1 class="text-lg font-semibold tracking-tight text-white">
            opconf
          </h1>
          <p class="text-xs text-neutral-500 mt-0.5">OpenCode configurator</p>
        </div>

        <ul class="flex-1 py-2 space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => (
            <li>
              <A
                href={item.href}
                class="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                activeClass="!text-white !bg-neutral-800"
                end={item.href === "/"}
              >
                <span class="w-6 h-6 flex items-center justify-center rounded bg-neutral-800 text-xs font-mono text-neutral-300">
                  {item.icon}
                </span>
                {item.label}
              </A>
            </li>
          ))}
        </ul>

        <div class="px-4 py-3 border-t border-neutral-800 text-xs text-neutral-600">
          v0.1.0
        </div>
      </nav>

      {/* Main content */}
      <main class="flex-1 overflow-y-auto p-6">
        {props.children}
      </main>
    </div>
  );
}
