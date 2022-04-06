import Head from 'next/head';
import Image from 'next/image';
import Timer from '../components/Timer';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Input, Button, Text, Space, Title } from '@mantine/core';
import useScript from '../components/useScript';


export default function Home() {
	const router = useRouter();
	const [input, setInput] = useState('');

	const createRoom = async e => {
		e.preventDefault();
		const id = Math.random()
			.toString(36)
			.substr(2, 5);
		await fetch('/api/create', {
			method: 'POST',
			body: JSON.stringify({
				name: id
			})
		});
		router.push(`/room/${id}`);
	};

	return (
    <>
      <head>
        <title> Mirror | Watch YouTube Videos Together</title>
      </head>
		<Container
			sx={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				minHeight: '100vh',
				flexDirection: 'column'
			}}
		>
      <Title order={1}>Mirror</Title>
      <Text size="md">Watch YouTube videos with your friends, in sync.</Text>
      <Space h="md" />
			<Container sx={{ display: 'flex' }}>
				<Input
					placeholder="Room Code"
					value={input}
					onChange={e => setInput(e.target.value)}
				/>
				<Space w="xs" />
				<Button onClick={() => router.push(`/room/${input}`)}>Join Room</Button>
			</Container>
			<Space h="sm" />
			<Text size="sm">or</Text>
			<Space h="sm" />
			<Button onClick={createRoom}>Create Room</Button>
		</Container>
    </>
	);
}
