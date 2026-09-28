import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Image from "next/image";
import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Grab the active session and the Access Token
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-24">
        <h1 className="text-5xl font-bold mb-8">My Listening Dashboard</h1>
        <a 
          href="/api/auth/signin" 
          className="bg-green-500 hover:bg-green-400 text-black px-8 py-4 rounded-full font-bold transition-all"
        >
          Log in with Spotify
        </a>
      </main>
    );
  }

  // Await search parameters (Next.js 15+ requirement) and determine the active tab
  const resolvedParams = await searchParams;
  const activeTimeRange = (resolvedParams.time_range as string) || "short_term";

  // @ts-expect-error - Grabbing our custom accessToken
  const accessToken = session.accessToken;
  
  // Inject the active time range dynamically into the fetch URL
  const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${activeTimeRange}&limit=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  const data = await res.json();
  const topTracks = data.items || [];

  // Determine dynamic title based on the active tab
  const tabTitle = 
    activeTimeRange === "long_term" ? "Lifetime" : 
    activeTimeRange === "medium_term" ? "Past 6 Months" : "Past Month";

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-12">
      <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
        <h1 className="text-4xl font-bold">Hello, {session.user?.name}</h1>
        <a href="/api/auth/signout" className="text-zinc-400 hover:text-white transition-colors">
          Sign Out
        </a>
      </header>

      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-semibold">Your Top Tracks ({tabTitle})</h2>
          
          {/* Clickable Tabs using Next.js Links */}
          <div className="flex gap-2 bg-zinc-900 p-1 rounded-full">
            <Link 
              href="/?time_range=short_term" 
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeTimeRange === 'short_term' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Past Month
            </Link>
            <Link 
              href="/?time_range=medium_term" 
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeTimeRange === 'medium_term' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Past 6 Months
            </Link>
            <Link 
              href="/?time_range=long_term" 
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                activeTimeRange === 'long_term' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Lifetime
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topTracks.map((track: any, index: number) => (
            <div key={track.id} className="bg-zinc-900 p-4 rounded-xl flex items-center gap-4 hover:bg-zinc-800 transition-colors">
              <span className="text-zinc-500 font-bold text-xl w-6">{index + 1}</span>
              {track.album.images[0] && (
                <Image 
                  src={track.album.images[0].url} 
                  alt={track.album.name} 
                  width={64} 
                  height={64} 
                  className="rounded-md"
                />
              )}
              <div className="flex flex-col overflow-hidden">
                <span className="font-bold truncate">{track.name}</span>
                <span className="text-zinc-400 text-sm truncate">
                  {track.artists.map((a: any) => a.name).join(", ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}