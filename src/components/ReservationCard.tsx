import { useRouter } from 'next/navigation';

type Props = {
  id: string;  // 募集IDなど一意な識別子
  time: string;
  members: number;
  capacity: number;
  owner: string;
};

export default function ReservationCard({ id, time, members, capacity, owner }: Props) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/reserve/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      style={{ cursor: 'pointer', padding: '8px', backgroundColor: members >= capacity ? '#66bb6a' : '#ffeb3b', marginBottom: 8, borderRadius: 4 }}
    >
      <div>🕒 {time}</div>
      <div>👥 {members}/{capacity}　🙋‍♂️ {owner}</div>
    </div>
  );
}
