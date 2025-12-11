import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, TrendingUp, Zap } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-primary bg-clip-text text-transparent">
              Minhas Finanças
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#benefits" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Benefícios
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Controle suas <span className="bg-gradient-primary bg-clip-text text-transparent">finanças</span> com facilidade
            </h1>
            <p className="text-lg text-muted-foreground">
              Gerencie suas despesas mensais, defina orçamentos e receba sugestões inteligentes para economizar. Tudo em um único lugar, com interface moderna e intuitiva.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white">
                Começar Agora
              </Button>
              <Button size="lg" variant="outline" className="border-border hover:bg-background/50">
                Saiba Mais
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative h-80 md:h-96">
            <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-3xl blur-3xl"></div>
            <div className="relative h-full flex items-center justify-center">
              <div className="w-full max-w-sm space-y-4">
                {/* Mock Dashboard Card */}
                <div className="gradient-card rounded-2xl p-6 border border-border/50 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Receita Mensal</span>
                      <span className="text-2xl font-bold text-primary">R$ 3.000</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Total de Despesas</span>
                      <span className="text-2xl font-bold text-accent">R$ 2.450</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-gradient-primary rounded-full"></div>
                    </div>
                    <div className="text-xs text-muted-foreground">81.7% do orçamento utilizado</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container py-20 md:py-32">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Recursos Poderosos</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tudo que você precisa para gerenciar suas finanças pessoais de forma eficiente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: BarChart3,
              title: "Entrada de Despesas",
              description: "Registre suas despesas por categoria de forma rápida e organizada",
            },
            {
              icon: TrendingUp,
              title: "Cálculo Automático",
              description: "Veja o total de despesas atualizado em tempo real",
            },
            {
              icon: PieChart,
              title: "Análise Visual",
              description: "Gráficos intuitivos mostram como você gasta seu dinheiro",
            },
            {
              icon: Zap,
              title: "Sugestões Inteligentes",
              description: "Receba recomendações personalizadas para economizar",
            },
          ].map((feature, idx) => (
            <Card key={idx} className="gradient-card border-border/50 hover:border-border transition-colors">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="container py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Por que usar Minhas Finanças?</h2>
            <ul className="space-y-4">
              {[
                "Controle total sobre suas despesas mensais",
                "Alertas automáticos quando você ultrapassa o orçamento",
                "Sugestões de economia baseadas em seus gastos",
                "Interface moderna e fácil de usar",
                "Acesso em qualquer dispositivo",
                "Dados seguros e privados",
              ].map((benefit, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative h-80 md:h-96">
            <div className="absolute inset-0 bg-gradient-accent opacity-10 rounded-3xl blur-3xl"></div>
            <div className="relative h-full flex items-center justify-center">
              <div className="w-full max-w-sm space-y-4">
                {/* Mock Alert Card */}
                <div className="gradient-accent rounded-2xl p-6 border border-destructive/50 bg-gradient-to-br from-destructive/10 to-accent/10 shadow-2xl">
                  <div className="space-y-3">
                    <p className="font-semibold text-destructive flex items-center gap-2">
                      <span className="text-lg">⚠️</span> Alerta de Orçamento
                    </p>
                    <p className="text-sm text-foreground">
                      Você excedeu seu orçamento em 8.3%
                    </p>
                    <div className="bg-background/50 rounded-lg p-3 border border-accent/30">
                      <p className="text-xs font-semibold text-accent mb-1">💡 Sugestão de Economia</p>
                      <p className="text-xs text-muted-foreground">
                        Reduza Lazer em 15% para voltar à meta
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-20 md:py-32">
        <div className="gradient-card rounded-3xl p-12 md:p-16 border border-border/50 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Pronto para controlar suas finanças?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comece agora mesmo e veja como é fácil gerenciar suas despesas e economizar dinheiro
          </p>
          <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-white">
            Começar Agora
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Minhas Finanças</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 Minhas Finanças. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
