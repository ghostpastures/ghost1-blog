import Link from "next/link";

const Header = () => {
  return (
    <div className="flex justify-between items-center mb-20 mt-8">
      <h2 className="text-2xl md:text-4xl font-bold tracking-tight md:tracking-tighter leading-tight flex items-center">
        <Link href="/" className="hover:underline">
          Blog
        </Link>
        .
      </h2>
      <Link
        href="/statistics"
        className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
      >
        Statistics
      </Link>
    </div>
  );
};

export default Header;
