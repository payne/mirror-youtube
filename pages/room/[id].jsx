import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
let socket;
import Timer from '../../components/Timer';
import db from '../../lib/database';
import YouTube from 'react-youtube';
import { Container, Input, Button, Space, Title, Text } from '@mantine/core';
import useScript from '../../components/useScript';
import { useRouter } from 'next/router';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const Room = ({ room }) => {
	const [time, setTime] = useState(-1);
	const paused = useRef(false);
	const [videoInput, setVideoInput] = useState('');
	const [video, setVideo] = useState(null);
	const youtubePlayer = useRef(null);
	const [loaded, setLoaded] = useState(false);
	const router = useRouter();
	const [roomId, setRoomId] = useState(router.query.id);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		const socketInitializer = async () => {
			await fetch('/api/socket');
			socket = io();

			socket.on('connect', () => {
				console.log('connected');
				socket.emit('joinRoom', room.id, room => {
					if (!room.is_playing) {
						setTime(room.last_track_time);
					} else {
						const time_since_last = Math.round(
							(Date.now() - room.last_played) / 1000
						);
						const track_time = room.last_track_time + time_since_last;
						setTime(track_time);
					}
					setVideo(room.current);
					paused.current = !room.is_playing;
					setLoaded(true);
				});
			});

			socket.on('pause', async time => {
				console.log('pause event');
				if (!paused.current) {
					paused.current = true;
					if (youtubePlayer.current !== null) {
						await youtubePlayer.current.seekTo(time);
						await youtubePlayer.current.pauseVideo();
					}
				}
			});

			socket.on('play', async time => {
				console.log('play event', paused.current);
				if (paused.current) {
					paused.current = false;
					if (youtubePlayer.current !== null) {
						await youtubePlayer.current.seekTo(time);
						await youtubePlayer.current.playVideo();
					}
				}
			});

			socket.on('setVideo', videoId => {
				paused.current = true;
				setTime(0);
				setVideo(videoId);
			});
		};
		socketInitializer();
	}, []);

	useScript('https://unpkg.com/cursor-chat');

	return (
		<>
			<main className="container">
				<link
					rel="stylesheet"
					type="text/css"
					href="https://unpkg.com/cursor-chat/dist/style.css"
				/>
				<div id="cursor-chat-layer">
					<input type="text" id="cursor-chat-box" />
				</div>
				<Container
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						marginTop: '10px',
						marginBottom: '10px'
					}}
				>
					<Input
						sx={{ flex: 1 }}
						placeholder="Youtube Video URL"
						value={videoInput}
						onChange={e => setVideoInput(e.target.value)}
					/>
					<Space w="md" />
					<Button
						onClick={e => {
							e.preventDefault();
							if (!videoInput) return;
							const videoUrl = new URL(videoInput);
							const videoId = videoUrl.searchParams.get('v');
							socket.emit('setVideo', room.id, videoId);
						}}
					>
						Choose Video
					</Button>
				</Container>
				<Container sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: 'center',
        }}>
					<Text>Room Id: {roomId}</Text>
          <Space w="sm" />
					<CopyToClipboard
						text={roomId}
						onCopy={() => {
							setCopied(true);
							setTimeout(() => {
								setCopied(false);
							}, 3000);
						}}
					>
						<Button disabled={copied}>{copied ? 'Copied!' : 'Copy'}</Button>
					</CopyToClipboard>
				</Container>
				<Container
					sx={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						minHeight: '80vh',
						width: '80vw'
					}}
				>
					{video ? (
						video.length > 0 &&
						time >= 0 && (
							<YouTube
								className="youtube-player"
								containerClassName="youtube-container"
								videoId={video}
								onReady={async e => {
									youtubePlayer.current = e.target;
									await e.target.seekTo(time);
									console.log('paused', paused.current, e.target);
									if (paused.current) {
										await e.target.pauseVideo();
									} else {
										await e.target.playVideo();
									}
								}}
								onPause={async e => {
									console.log('onPause', await e.target.getCurrentTime());
									if (!paused.current) {
										socket.emit(
											'pause',
											room.id,
											await e.target.getCurrentTime()
										);
									}
								}}
								onPlay={async e => {
									console.log('onPlay', await e.target.getCurrentTime());
									if (paused.current) {
										socket.emit(
											'play',
											room.id,
											await e.target.getCurrentTime()
										);
									}
								}}
							/>
						)
					) : loaded ? (
						<Title order={2}>No video is currently being played.</Title>
					) : null}
				</Container>
				<Container
					sx={{
						alignItems: 'center',
						justifyContent: 'center',
						position: 'relative',
						bottom: '10px',
						margin: 'auto',
						width: '100vw',
						maxWidth: 'none'
					}}
				>
					<Text
						sx={{
							marginLeft: 'auto',
							marginRight: 'auto',
							width: 'fit-content'
						}}
					>
						Press <span className="highlight">/</span> to start chatting and{' '}
						<span className="highlight">esc</span> to clear your chat bubble!<a
							href="https://github.com/jackyzha0/cursor-chat"
							target="_blank"
							rel="noreferrer"
							className="attribution"
						>
							{' '}
							Cursor Chat by Jacky
						</a>
					</Text>
				</Container>
			</main>
		</>
	);
};

export const getServerSideProps = async ({ params }) => {
	const room = await db.get(params.id);

	if (!room)
		return {
			redirect: {
				permanent: false,
				destination: '/404'
			},
			props: {}
		};

	return {
		props: { room }
	};
};

export default Room;
