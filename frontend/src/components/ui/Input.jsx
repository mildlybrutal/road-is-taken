import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Input({ className, ...props }) {
    return (
        <input
            className={twMerge(
                clsx(
                    "flex h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-gray-100 ring-offset-gray-950 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )
            )}
            {...props}
        />
    );
}
