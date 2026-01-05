import { motion } from "framer-motion";
import { Navigation } from "@/components/Navigation";
import { ShieldCheck, Zap, Globe, Users } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial="initial"
          animate="animate"
          className="max-w-3xl mb-16"
        >
          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-display font-bold text-white mb-8">
            The Future of <br/>
            <span className="text-primary">Fashion Identity</span>
          </motion.h1>
          <motion.p variants={fadeInUp} className="text-xl text-neutral-400 leading-relaxed mb-8">
            ONYU is not just a brand; it's a digital-first fashion ecosystem. We bridge the gap between high-end apparel and cutting-edge technology to create a seamless, personalized experience for the modern individual.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="aspect-square bg-neutral-900 rounded-2xl overflow-hidden"
          >
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2670&auto=format&fit=crop" 
              alt="Our Process" 
              className="w-full h-full object-cover opacity-80"
            />
          </motion.div>
          
          <div className="space-y-12">
            <div>
              <h2 className="text-3xl font-display font-bold text-white mb-4">Our Vision</h2>
              <p className="text-neutral-400 leading-relaxed">
                We believe that fashion should be as dynamic as the world we live in. By leveraging AI and real-time pose tracking, we empower our customers to express themselves with confidence, ensuring a perfect fit and style before the garment even leaves our workshop.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <ShieldCheck className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-white">Privacy First</h3>
                <p className="text-sm text-neutral-500">Local processing ensures your data never leaves your device.</p>
              </div>
              <div className="space-y-4">
                <div className="p-3 bg-primary/10 rounded-lg w-fit">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-white">Innovation</h3>
                <p className="text-sm text-neutral-500">Proprietary AI models built specifically for garment draping.</p>
              </div>
            </div>
          </div>
        </div>

        <section className="bg-neutral-900 rounded-3xl p-8 md:p-16 text-center border border-white/5">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-8">Ready to define your look?</h2>
            <Link href="/shop" className="inline-flex px-12 py-4 bg-white text-black font-bold rounded-full hover:bg-neutral-200 transition-colors">
              Enter The Shop
            </Link>
          </motion.div>
        </section>
      </div>

      <footer className="bg-background border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xl font-display font-bold tracking-tighter text-white">
            ONYU<span className="text-primary">.</span>
          </span>
          <p className="text-sm text-neutral-600 mt-4">© 2025 ONYU Digital Fashion.</p>
        </div>
      </footer>
    </div>
  );
}
