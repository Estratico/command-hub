import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
  Row,
  Column,
  Button,
} from "@react-email/components";
import Image from "next/image";

interface EmailTemplateProps {
  data: any;
  type: "contact" | "newsletter" | "discovery"|"team-invite";
}

export function EmailTemplate({ data, type }: EmailTemplateProps) {
  switch (type) {
    case "contact":
      return <ContactEmailTemplate data={data} />;
    case "discovery":
      return <DiscoveryConfirmationEmail data={data} />;
    case "newsletter":
      return <NewsletterEmailTemplate data={data} />;
    case "team-invite": // Added case
      return <TeamInvitationEmail data={data} />;
  }
}

export function ContactEmailTemplate({
  data,
}: {
  data: any & {
    subject: string;
  };
}) {
  const previewText = `New Enquiry from ${data.name} - ${data.company || "Personal"}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 max-w-116.25 bg-white shadow-sm">
            {/* Header / Brand */}
            <Section className="mt-8 text-center">
              <Heading className="text-black text-[24px] font-bold p-0 my-7.5 mx-0 uppercase tracking-tighter">
                ESTRATICO
              </Heading>
            </Section>

            <Heading className="text-black text-[18px] font-semibold p-0 mb-4 mx-0">
              Project Consultation Request
            </Heading>

            <Text className="text-gray-600 text-[14px] leading-6">
              A new high-intent inquiry has been submitted. Here are the project
              specifics:
            </Text>

            {/* Section 1: Lead Identity */}
            <Section className="bg-gray-50 rounded-lg p-4 mb-4 border border-solid border-gray-100">
              <Text className="text-[12px] font-bold uppercase text-gray-400 mb-2 tracking-widest">
                Client Profile
              </Text>
              <Row>
                <Column>
                  <Text className="m-0 text-[14px]">
                    <span className="font-semibold">Name:</span> {data.name}
                  </Text>
                  <Text className="m-0 text-[14px]">
                    <span className="font-semibold">Email:</span> {data.email}
                  </Text>
                </Column>
              </Row>
              <Row className="mt-2">
                <Column>
                  <Text className="m-0 text-[14px]">
                    <span className="font-semibold">Company:</span>{" "}
                    {data.company || "N/A"}
                  </Text>
                  <Text className="m-0 text-[14px]">
                    <span className="font-semibold">Role:</span>{" "}
                    {data.jobTitle || "Not Specified"}
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Section 2: Project Parameters */}
            <Section className="mb-6">
              <Text className="text-[12px] font-bold uppercase text-gray-400 mb-2 tracking-widest">
                Scope & Logistics
              </Text>
              <table className="w-full">
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-[14px] text-gray-600">Service:</td>
                  <td className="py-2 text-[14px] font-medium text-right">
                    {data.service}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-[14px] text-gray-600">
                    Project Type:
                  </td>
                  <td className="py-2 text-[14px] font-medium text-right">
                    {data.projectType}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-[14px] text-gray-600">Budget:</td>
                  <td className="py-2 text-[14px] font-medium text-right text-green-700">
                    {data.budget}
                  </td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-[14px] text-gray-600">Timeline:</td>
                  <td className="py-2 text-[14px] font-medium text-right">
                    {data.timeline}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-[14px] text-gray-600">Source:</td>
                  <td className="py-2 text-[14px] font-medium text-right italic">
                    {data.referral || "Direct"}
                  </td>
                </tr>
              </table>
            </Section>

            {/* Section 3: The Brief */}
            <Section className="mb-6">
              <Text className="text-[12px] font-bold uppercase text-gray-400 mb-2 tracking-widest">
                Project Description
              </Text>
              <Text className="text-[14px] leading-6 bg-gray-50 p-4 rounded border-l-4 border-solid border-black italic">
                "{data.message}"
              </Text>
            </Section>

            <Hr className="border border-solid border-[#eaeaea] my-6.5 mx-0 w-full" />

            {/* CTA / Footer */}
            <Section className="text-center">
              <Text className="text-[#666666] text-[12px] leading-6">
                Estratico Internal Notification System <br />
                Gweru, Midlands, Zimbabwe
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

interface DiscoveryConfirmationEmailProps {
  link: string;
  time: string;
}

export const DiscoveryConfirmationEmail = ({
  data,
}: {
  data: DiscoveryConfirmationEmailProps;
}) => {
  const formattedDate = new Date(data.time).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <Html>
      <Head />
      <Preview>Your Estratico Discovery Call is Confirmed</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto py-10 px-5 max-w-145">
            <Heading className="text-black text-2xl font-bold text-center uppercase tracking-tighter my-8">
              Estratico
            </Heading>

            <Section className="bg-gray-50 rounded-xl p-8 border border-solid border-gray-100">
              <Heading className="text-xl font-semibold mb-4">
                Meeting Confirmed
              </Heading>
              <Text className="text-gray-600 text-base leading-relaxed">
                Hello, we've successfully scheduled your technical discovery
                call. Our team is looking forward to discussing your project
                requirements and exploring how we can build something great
                together.
              </Text>

              <Section className="my-6">
                <Text className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-1">
                  When
                </Text>
                <Text className="text-gray-900 font-medium m-0">
                  {formattedDate}
                </Text>
              </Section>

              <Section className="my-6">
                <Text className="text-xs uppercase font-bold text-gray-400 tracking-widest mb-1">
                  Where
                </Text>
                <Text className="text-gray-900 font-medium m-0">
                  Jitsi Meet
                </Text>
              </Section>

              <Button
                className="bg-black rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mt-4"
                href={data.link}
              >
                Join On Jitsi Meet
              </Button>
            </Section>

            <Text className="text-gray-400 text-xs text-center mt-8">
              If you need to reschedule, please reply to this email at least 2
              hours before the session.
              <br />© {new Date().getFullYear()} Estratico Technologies. Gweru,
              Zimbabwe.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export function NewsletterEmailTemplate({
  data,
}: {
  data: EmailTemplateProps["data"];
}) {
  return (
    <div>
      <h1>Welcome, {data.name}!</h1>
    </div>
  );
}

interface TeamInvitationEmailProps {
  invitedBy: string;
  teamName: string;
  inviteLink: string;
}

export function TeamInvitationEmail({
  data,
}: {
  data: TeamInvitationEmailProps;
}) {
  const previewText = `Join ${data.teamName} on Estratico Command Hub`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-10 mx-auto p-5 max-w-116.25 bg-white shadow-sm">
            {/* Header / Brand */}
            <Section className="mt-8 text-center">
              <Heading className="text-black text-[24px] font-bold p-0 my-7.5 mx-0 uppercase tracking-tighter">
                ESTRATICO
              </Heading>
            </Section>

            <Heading className="text-black text-[20px] font-semibold p-0 mb-4 mx-0 text-center">
              You've been invited!
            </Heading>

            <Text className="text-gray-600 text-[14px] leading-6 text-center">
              <strong>{data.invitedBy}</strong> has invited you to join the{" "}
              <strong>{data.teamName}</strong> workspace on Estratico.
            </Text>

            <Section className="text-center mt-8 mb-8">
              <Button
                className="bg-black rounded-md text-white text-[14px] font-semibold no-underline text-center px-10 py-3"
                href={data.inviteLink}
              >
                Accept Invitation
              </Button>
            </Section>

            <Text className="text-gray-500 text-[12px] leading-6 text-center px-4">
              If you weren't expecting this invitation, you can safely ignore this email. 
              This link will expire in 7 days.
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-6 mx-0 w-full" />

            {/* Footer */}
            <Section className="text-center">
              <Text className="text-[#999999] text-[11px] leading-6">
                Estratico Technologies <br />
                Gweru, Midlands, Zimbabwe
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
