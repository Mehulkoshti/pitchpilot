import { HowItWorks } from '@/components/HowItWorks';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { FinalCta } from '@/components/landing/FinalCta';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProofStrip } from '@/components/landing/ProofStrip';
import { SustainabilityBand } from '@/components/landing/SustainabilityBand';
import { VenuesSection } from '@/components/landing/VenuesSection';
import { getLandingData } from '@/lib/landing';

/**
 * Public landing page. Every figure is computed from the real engines
 * ({@link getLandingData}), so the page demonstrates the product rather than
 * describing it.
 */
export default function HomePage(): React.JSX.Element {
  const data = getLandingData();

  return (
    <>
      <HeroSection
        statuses={data.statuses}
        fastest={data.fastest}
        busiest={data.busiest}
      />
      <ProofStrip
        fastest={data.fastest}
        busiest={data.busiest}
        stepFreeRoute={data.stepFreeRoute}
        rail={data.rail}
        car={data.car}
      />
      <FeaturesSection />
      <HowItWorks />
      <SustainabilityBand
        mixedTonnes={data.mixedTonnes}
        allCarTonnes={data.allCarTonnes}
        tonnesSaved={data.tonnesSaved}
      />
      <VenuesSection
        totalSeats={data.totalSeats}
        hostCountryCount={data.hostCountryCount}
      />
      <FinalCta />
    </>
  );
}
