import { MatchRoom } from "@/components/match-room";

export default async function RoomPage(props: PageProps<"/room/[roomId]">) {
  const { roomId } = await props.params;
  return <MatchRoom roomId={roomId} />;
}
