import { Navbar } from "@/components/cpd/Navbar";
import { Hero } from "@/components/cpd/Hero";
import { TrainingShowcase } from "@/components/cpd/TrainingShowcase";
import { Faq } from "@/components/cpd/Faq";
import { Footer } from "@/components/cpd/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />
      <Hero />
      <TrainingShowcase />
      <Faq />
      <Footer />
    </main>
  );
};

export default Index;
