import { CustomCursor } from './landing/primitives';
import {
  AIProviders,
  AnalyticsPreview,
  CTASection,
  ChannelsSection,
  FAQ,
  Footer,
  HeroSection,
  HowItWorks,
  Navigation,
  Pricing,
  ProblemSection,
  ProductShowcase,
  SocialProof,
  SolutionSection,
  StatsStrip,
  Testimonials,
  VoiceSection,
} from './landing/sections';

export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-bg text-text">
      <CustomCursor size={42} dotSize={6} hoverScale={1.9} />
      <Navigation />
      <main>
        <HeroSection />
        <SocialProof />
        <StatsStrip />
        <ProblemSection />
        <SolutionSection />
        <ProductShowcase />
        <ChannelsSection />
        <HowItWorks />
        <AIProviders />
        <VoiceSection />
        <AnalyticsPreview />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
