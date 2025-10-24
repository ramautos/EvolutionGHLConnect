import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import testimonial1 from '@assets/generated_images/Business_testimonial_photo_1_28a369d4.png';
import testimonial2 from '@assets/generated_images/Business_testimonial_photo_2_53184f24.png';
import testimonial3 from '@assets/generated_images/Business_testimonial_photo_3_a1870428.png';

const testimonials = [
  {
    name: "María González",
    role: "CEO",
    company: "Digital Marketing Pro",
    image: testimonial1,
    content: "Esta plataforma transformó completamente nuestra operación. Ahora gestionamos 50+ clientes con WhatsApp automatizado. ¡Increíble!",
  },
  {
    name: "Carlos Mendoza",
    role: "Director de Ventas",
    company: "Growth Agency",
    image: testimonial2,
    content: "La integración con GoHighLevel es perfecta. El setup tomó literalmente 5 minutos y ya estamos viendo resultados.",
  },
  {
    name: "Ana Chen",
    role: "Fundadora",
    company: "E-commerce Solutions",
    image: testimonial3,
    content: "El soporte es excepcional y la detección automática del número de teléfono funciona perfectamente. Altamente recomendado.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-card/30" data-testid="section-testimonials">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold" style={{ fontFamily: 'var(--font-accent)' }}>
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-xl text-muted-foreground">
            Más de 2,000 empresas confían en nuestra plataforma
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="p-8 border-card-border"
              data-testid={`testimonial-card-${index}`}
            >
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="flex items-center gap-4">
                <img 
                  src={testimonial.image} 
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover"
                  data-testid={`testimonial-avatar-${index}`}
                />
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
