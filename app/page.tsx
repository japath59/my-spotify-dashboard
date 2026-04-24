import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import Image from "next/image";

export default async function Home() {
  // Grab the active session and the Access Token we exposed
  const session = await getServerSession(authOptions);

  // If the user is not logged in, show a login button
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

  // If logged in, fetch their Top Tracks from my API
  // @ts-expect-error - Grabbing our custom accessToken
  const accessToken = session.accessToken;
  
  const res = await fetch("https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  
  const data = await res.json();
  const topTracks = data.items || [];

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-12">
      <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
        <h1 className="text-4xl font-bold">Hello, {session.user?.name}</h1>
        <a href="/api/auth/signout" className="text-zinc-400 hover:text-white transition-colors">
          Sign Out
        </a>
      </header>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Your Top Tracks (This Month)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Map over the JSON response to build the UI */}
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