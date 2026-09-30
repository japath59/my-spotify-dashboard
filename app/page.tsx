import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Image from "next/image";
import Link from "next/link";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
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

  // Await search parameters and determine active tab states
  const resolvedParams = await searchParams;
  const activeTimeRange = (resolvedParams.time_range as string) || "short_term";
  const activeType = (resolvedParams.type as string) || "tracks"; // defaults to tracks

  // @ts-expect-error - Grabbing our custom accessToken
  const accessToken = session.accessToken;
  
  // Inject BOTH the active type (artists or tracks) and time range into the fetch URL
  const res = await fetch(`https://api.spotify.com/v1/me/top/${activeType}?time_range=${activeTimeRange}&limit=50`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  const data = await res.json();
  const topItems = data.items || [];

  const timeTitle = 
    activeTimeRange === "long_term" ? "Lifetime" : 
    activeTimeRange === "medium_term" ? "Past 6 Months" : "Past Month";
    
  const typeTitle = activeType === "artists" ? "Top Artists" : "Top Tracks";

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8 md:p-12">
      <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
        <h1 className="text-4xl font-bold">Hello, {session.user?.name}</h1>
        <a href="/api/auth/signout" className="text-zinc-400 hover:text-white transition-colors">
          Sign Out
        </a>
      </header>

      <section>
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 gap-6">
          <h2 className="text-2xl font-semibold">Your {typeTitle} ({timeTitle})</h2>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* TYPE TOGGLE: Tracks vs Artists (preserves current time_range) */}
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-full w-fit">
              <Link 
                href={`/?type=tracks&time_range=${activeTimeRange}`} 
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeType === 'tracks' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Tracks
              </Link>
              <Link 
                href={`/?type=artists&time_range=${activeTimeRange}`} 
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeType === 'artists' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Artists
              </Link>
            </div>

            {/* TIME RANGE TOGGLE (preserves current type) */}
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-full w-fit">
              <Link 
                href={`/?type=${activeType}&time_range=short_term`} 
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTimeRange === 'short_term' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Past Month
              </Link>
              <Link 
                href={`/?type=${activeType}&time_range=medium_term`} 
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTimeRange === 'medium_term' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Past 6 Months
              </Link>
              <Link 
                href={`/?type=${activeType}&time_range=long_term`} 
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                  activeTimeRange === 'long_term' ? 'bg-green-500 text-black' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Lifetime
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Dynamically map the data based on if it's an artist or track object */}
          {topItems.map((item: any, index: number) => {
            // Artists have images directly, tracks have them nested in the album object
            const imageUrl = activeType === "artists" 
              ? item.images?.[0]?.url 
              : item.album?.images?.[0]?.url;
              
            // Artists use genres as subtitle, tracks use artist names
            const subtitle = activeType === "artists"
              ? item.genres?.slice(0, 2).join(", ") || "Artist"
              : item.artists?.map((a: any) => a.name).join(", ");

            return (
              <div key={item.id} className="bg-zinc-900 p-4 rounded-xl flex items-center gap-4 hover:bg-zinc-800 transition-colors">
                <span className="text-zinc-500 font-bold text-xl w-6 flex-shrink-0">{index + 1}</span>
                {imageUrl && (
                  <Image 
                    src={imageUrl} 
                    alt={item.name} 
                    width={64} 
                    height={64} 
                    className={`object-cover ${activeType === 'artists' ? 'rounded-full' : 'rounded-md'}`}
                  />
                )}
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold truncate">{item.name}</span>
                  <span className="text-zinc-400 text-sm truncate capitalize">
                    {subtitle}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}