import { Navbar } from "@/components/cpd/Navbar";
import { Hero } from "@/components/cpd/Hero";
import { HowItWorks } from "@/components/cpd/HowItWorks";
import { Categories } from "@/components/cpd/Categories";
import { Footer } from "@/components/cpd/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Categories />
      <Footer />
    </main>
  );
};

export default Index;
