import { Body, Button, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";

type Props = { subject: string; body: string; ctaLabel?: string; ctaUrl?: string };

export function MessageEmail({ subject, body, ctaLabel, ctaUrl }: Props) {
  const paragraphs = body.split(/\n{2,}/);
  return (
    <Html lang="en">
      <Head />
      <Preview>{subject}</Preview>
      <Body style={{ background: "#F5EDE1", margin: 0, padding: "24px 12px", fontFamily: "Helvetica, Arial, sans-serif" }}>
        <Container style={{ maxWidth: 520, background: "#FFFFFF", borderRadius: 20, overflow: "hidden" }}>
          <Section style={{ background: "#17120F", padding: "22px 28px" }}>
            <Text style={{ color: "#F5EDE1", margin: 0, fontSize: 15, letterSpacing: "0.2em", fontWeight: 700 }}>
              SHAWARMA THEORY
            </Text>
          </Section>
          <Section style={{ padding: "26px 28px 8px" }}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={{ color: "#2A211C", fontSize: 16, lineHeight: "1.6", margin: "0 0 14px", whiteSpace: "pre-line" }}>
                {p}
              </Text>
            ))}
            {ctaUrl && ctaLabel ? (
              <Button
                href={ctaUrl}
                style={{ background: "#C8361D", color: "#FFFFFF", borderRadius: 999, padding: "14px 26px", fontWeight: 600, fontSize: 15 }}
              >
                {ctaLabel}
              </Button>
            ) : null}
          </Section>
          <Hr style={{ borderColor: "#E3D4BF", margin: "22px 28px 0" }} />
          <Text style={{ color: "#8A7563", fontSize: 12, padding: "12px 28px 22px", margin: 0 }}>
            510 Bayfield St, Barrie, ON
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
