import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-white text-gray-900">
    {/* Hero */}
    <section className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
    <h1 className="text-6xl md:text-8xl font-extrabold text-pink-500 tracking-tight mb-4">
    Velaris
    </h1>
    <p className="text-xl md:text-2xl text-pink-400 font-semibold mb-6 max-w-lg">
    Privacy-first matching.<br />Real connections. No nonsense.
    </p>
    <p className="text-lg text-gray-600 mb-8 max-w-md">
    Values, lifestyle, personality, and cognitive compatibility — without the superficial stuff.
    </p>
    <div className="flex flex-col sm:flex-row gap-4">
    <Link
    href="/register"
    className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-8 rounded-full text-lg transition"
    >
    Get Started
    </Link>
    <Link
    href="/login"
    className="border-2 border-pink-500 text-pink-500 hover:bg-pink-50 font-bold py-3 px-8 rounded-full text-lg transition"
    >
    Log In
    </Link>
    </div>
    </section>

    {/* Features */}
    <section className="py-16 px-6 bg-pink-50">
    <h2 className="text-4xl font-extrabold text-pink-500 text-center mb-12">
    Why Velaris?
    </h2>
    <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
    <div>
    <h3 className="text-2xl font-bold text-pink-500 mb-2">Privacy First</h3>
    <p className="text-gray-700">
    Region only. No exact location. Anonymous chat via short-lived codes.
    </p>
    </div>
    <div>
    <h3 className="text-2xl font-bold text-pink-500 mb-2">Real Matching</h3>
    <p className="text-gray-700">
    Values, lifestyle, interests, personality, and cognitive score. No income or looks.
    </p>
    </div>
    <div>
    <h3 className="text-2xl font-bold text-pink-500 mb-2">Honesty Encouraged</h3>
    <p className="text-gray-700">
    Built to reward genuine answers instead of gaming the system.
    </p>
    </div>
    </div>
    </section>

    {/* How it works */}
    <section className="py-16 px-6">
    <h2 className="text-4xl font-extrabold text-pink-500 text-center mb-12">
    How it works
    </h2>
    <div className="max-w-2xl mx-auto space-y-6 text-center">
    <div>
    <span className="inline-block bg-pink-500 text-white font-bold rounded-full w-8 h-8 leading-8 mb-2">1</span>
    <p className="text-lg">Create your account.</p>
    </div>
    <div>
    <span className="inline-block bg-pink-500 text-white font-bold rounded-full w-8 h-8 leading-8 mb-2">2</span>
    <p className="text-lg">Answer the personality + cognitive questionnaire.</p>
    </div>
    <div>
    <span className="inline-block bg-pink-500 text-white font-bold rounded-full w-8 h-8 leading-8 mb-2">3</span>
    <p className="text-lg">Set your preferences.</p>
    </div>
    <div>
    <span className="inline-block bg-pink-500 text-white font-bold rounded-full w-8 h-8 leading-8 mb-2">4</span>
    <p className="text-lg">Get matched and opt in when it feels right.</p>
    </div>
    </div>
    </section>

    {/* Final CTA */}
    <section className="py-20 px-6 text-center bg-pink-50">
    <h2 className="text-4xl font-extrabold text-pink-500 mb-6">
    Ready to find someone real?
    </h2>
    <Link
    href="/register"
    className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-bold py-4 px-10 rounded-full text-xl transition"
    >
    Join Velaris
    </Link>
    </section>
    </div>
  );
}
