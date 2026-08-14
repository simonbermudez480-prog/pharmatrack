import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Problema from "@/components/Problema";
import Solucion from "@/components/Solucion";
import ComoFunciona from "@/components/ComoFunciona";
import Testimonios from "@/components/Testimonios";
import CTAFinal from "@/components/CTAFinal";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Problema />
        <Solucion />
        <ComoFunciona />
        <Testimonios />
        <CTAFinal />
      </main>
      <Footer />
    </>
  );
}
