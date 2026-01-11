'use client'

import { Header } from '@/components/Header'
import { HeroSection } from '@/components/couple-lp/HeroSection'
import { StructureCardsSection } from '@/components/couple-lp/StructureCardsSection'
import { ValuesGapSection } from '@/components/couple-lp/ValuesGapSection'
import { RedefinitionSection } from '@/components/couple-lp/RedefinitionSection'
import { Surprise4Section } from '@/components/couple-lp/Surprise4Section'
import { Tools3CardsSection } from '@/components/couple-lp/Tools3CardsSection'
import { ChoiceCTASection } from '@/components/couple-lp/ChoiceCTASection'

export default function CoupleLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <HeroSection />
        <StructureCardsSection />
        <ValuesGapSection />
        <RedefinitionSection />
        <Surprise4Section />
        <Tools3CardsSection />
        <ChoiceCTASection />
      </main>
    </div>
  )
}