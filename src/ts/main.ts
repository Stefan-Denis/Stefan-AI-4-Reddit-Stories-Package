/**
 * @file Main file of the Stefan AI 4 - Reddit Story Generator System.
 * 
 * @author Ștefan Denis
 * 
 * @remarks
 * This file contains the main logic for generating Reddit stories using the Stefan AI 4 package.
 * It imports necessary APIs and packages, defines the `Main` class, and provides methods for creating audio files and subtitles.
 * The `Main` class is responsible for starting the program and executing the necessary steps to generate the story and subtitles.
 * 
 * @remarks
 * The program reads the story and title data from files, creates audio files using the Google Cloud Text-to-Speech API,
 * and generates subtitles for the story audio file using the StefanAPI.Subtitles module.
 * 
 * @remarks
 * The program uses the following APIs and packages:
 * - StefanAPI: A custom API for generating subtitles.
 * - @google-cloud/text-to-speech: A package for generating audio files from text using the Google Cloud Text-to-Speech API.
 * - child_process: A built-in Node.js module for spawning child processes.
 * - dotenv: A package for loading environment variables from a .env file.
 * - chalk: A package for styling console output.
 * - fs-extra: A package for working with the file system.
 * - path: A built-in Node.js module for working with file paths.
 * - util: A built-in Node.js module for working with utilities.
 * - url: A built-in Node.js module for working with URLs.
 * 
 * @remarks
 * The program follows the folder structure and conventions of the Stefan AI 4 project.
 * It ensures clean and readable code by organizing the logic into separate methods and classes.
 * 
 * @remarks
 * To use this program, make sure to provide the necessary environment variables in a .env file located in the project's db folder.
 * The program can be started by calling the `main` method of the `Main` class.
 * 
 * @remarks
 * Note: This code is a selection from a larger codebase and may require additional dependencies and setup to run properly.
 */

// API import
import StefanAPI from "../../../../../api/out/stefanAPI.js"

// Package imports
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { spawnSync, spawn } from 'child_process'
import { configDotenv } from 'dotenv'
import crypto from 'crypto'
import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import util from 'util'
import url from 'url'

namespace RedditStoryGenerator {
    const test: 'none' | 'createAudio' | 'createSubtitles' | 'createVideo' = 'none'
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
    configDotenv({ path: path.join(__dirname, '../../db/.env') })

    /**
     * The main class of the program.
     * 
     * @remarks
     * This class is the main class of the program.
     * It is used to start the program.
     */
    export class Main {
        /**
         * The main method of the program.
         * 
         * @remarks
         * This method is the main method of the program.
         * It is used to start the program.
         * 
         * @param args The arguments of the program.
         */
        public static async main(): Promise<void> {
            console.log(chalk.rgb(101, 50, 135)('╭──────────────────────────────────────────────╮'))
            console.log(chalk.rgb(101, 50, 135)('│ Stefan AI 4 - Reddit story Generator Package │'))
            console.log(chalk.rgb(101, 50, 135)('╰──────────────────────────────────────────────╯'))

            // ? Generate the story and title data
            const audioPath = path.join(__dirname, '../../db/temp/audio')
            if (test === 'none' || test === 'createAudio') {
                // Perform checks to safely create the audio file
                if (fs.existsSync(audioPath)) {
                    fs.removeSync(audioPath)
                }

                // Now we have no directory so we can create it
                fs.mkdirSync(audioPath)
            }

            // Create audio for the story and title
            const story: string = fs.readFileSync(path.join(__dirname, '../../db/story.txt'), 'utf-8')
            const title: string = fs.readFileSync(path.join(__dirname, '../../db/title.txt'), 'utf-8')

            test === 'none' || test === 'createAudio' ? await this.createAudio(story, 'story.mp3', audioPath) : null
            test === 'none' || test === 'createAudio' ? await this.createAudio(title, 'title.mp3', audioPath) : null
            console.log(chalk.green('✅ Audio file created!'))

            // ? Create the subtitles
            // Create Subtitles for the story only
            test === 'none' || test === 'createSubtitles' ? await this.createSubtitles() : null

            // ? Create Video
            test === 'none' || test === 'createVideo' ? await VideoCreator.main() : null

            spawn('explorer', [path.join(__dirname, '../../output')])
        }

        /**
         * Creates an audio file from a text.
         * 
         * @param text The text to convert to audio.
         * @param filename The name of the audio file to create.
         * @param audioPath The path where the audio file will be saved.
         */
        public static async createAudio(text: string, filename: string, audioPath: string): Promise<void> {
            const client = new TextToSpeechClient()
            const request: object = {
                'audioConfig': {
                    'audioEncoding': 'LINEAR16',
                    'effectsProfileId': [
                        'large-home-entertainment-class-device'
                    ],
                    'pitch': 0,
                    'speakingRate': 1
                },
                'input': {
                    'text': text
                },
                'voice': {
                    'languageCode': 'en-US',
                    'name': 'en-US-Neural2-C'
                }
            }

            // Save tts audio to file
            const [response] = await client.synthesizeSpeech(request)
            const writeFile = util.promisify(fs.writeFile)

            try {
                await writeFile(path.join(audioPath, filename), response.audioContent as string, 'binary')
            } catch (error) {
                console.log(chalk.red('❌ Error creating audio file!'))
                console.log(error)
                process.exit(1)
            }
        }

        /**
         * Creates subtitles for the Story Audio file.
         */
        public static async createSubtitles(): Promise<void> {
            const tempSubtitleDir = path.join(__dirname, '../../db/temp/subtitles')

            // Create the directory
            if (fs.existsSync(tempSubtitleDir)) {
                fs.removeSync(tempSubtitleDir)
            } fs.mkdirSync(tempSubtitleDir)

            // Add the default styles of the subtitles to the file
            const defaultStyle = fs.readFileSync(path.join(__dirname, '../../db/subtitles/default.ass'), 'utf-8')
            fs.writeFileSync(path.join(tempSubtitleDir, 'subtitles.ass'), defaultStyle)

            // Create .lab transcript
            const transcriptFile = path.join(__dirname, '../../db/temp/subtitles/story.lab')
            if (fs.existsSync(transcriptFile)) fs.removeSync(transcriptFile); fs.createFileSync(transcriptFile)
            fs.writeFileSync(transcriptFile, fs.readFileSync(path.join(__dirname, '../../db/story.txt'), 'utf-8'))

            // Create the subtitles
            await StefanAPI.Subtitles.audioToSubtitles(path.join(__dirname, '../../db/temp/audio/story.mp3'), transcriptFile, path.join(tempSubtitleDir, 'subtitles.ass'))

            // Adjust the timings so that they don't overlap with the overlay
            const ffprobeOutput = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', path.join(__dirname, '../../db/temp/audio/title.mp3')])
            const durationInSeconds = parseFloat(ffprobeOutput.stdout.toString())

            SubtitleAdjuster.adjustTimestamps(path.join(tempSubtitleDir, 'subtitles.ass'), durationInSeconds)

            console.log(chalk.green('✅ Created Subtitles'))
        }
    }

    /**
     * Class responsible for adjusting timestamps in subtitles.
     */
    class SubtitleAdjuster {
        /**
         * Adjusts the timestamps in a subtitle file by adding a specified overlay length.
         * @param subtitleFilePath - The path to the subtitle file.
         * @param overlayLength - The length of the overlay to be added in seconds.
         * @returns A Promise that resolves when the timestamps have been adjusted.
         */
        static async adjustTimestamps(subtitleFilePath: string, overlayLength: number): Promise<void> {
            const data = fs.readFileSync(subtitleFilePath, 'utf-8')
            const lines = data.split('\n')

            for (let i = 0; i < lines.length; i++) {
                if (lines[i]) {
                    const parts = lines[i]!.split(',')

                    if (parts.length > 2 && parts[1] && parts[2]) {
                        const startTime = this.addSeconds(parts[1], overlayLength)
                        const endTime = this.addSeconds(parts[2], overlayLength)

                        parts[1] = startTime
                        parts[2] = endTime

                        lines[i] = parts.join(',')
                    }
                }
            }

            fs.writeFileSync(subtitleFilePath, lines.join('\n'))
        }

        /**
         * Adds the specified number of seconds to the given time.
         * 
         * @param time - The time in the format "HH:MM:SS".
         * @param secondsToAdd - The number of seconds to add.
         * @returns The updated time in the format "HH:MM:SS".
         */
        private static addSeconds(time: string, secondsToAdd: number): string {
            const parts = time.split(':')

            if (parts[0] && parts[1] && parts[2]) {
                let hours = parseInt(parts[0])
                let minutes = parseInt(parts[1])
                let seconds = parseFloat(parts[2])

                seconds += secondsToAdd

                if (seconds >= 60) {
                    minutes += Math.floor(seconds / 60)
                    seconds %= 60
                }

                if (minutes >= 60) {
                    hours += Math.floor(minutes / 60)
                    minutes %= 60
                }

                return `${hours.toFixed(0).padStart(2, '0')}:${minutes.toFixed(0).padStart(2, '0')}:${seconds.toFixed(2).padStart(5, '0')}`
            }

            return time
        }
    }

    /**
     * Represents a video creator.
     */
    class VideoCreator {
        /**
         * The main function that orchestrates the execution of the class.
         * It generates a random video, concatenates audios, and creates a video.
         * @returns A Promise that resolves when the execution is complete.
         */
        public static async main(): Promise<void> {
            if (fs.existsSync(path.join(__dirname, '../../db/temp/videos'))) fs.removeSync(path.join(__dirname, '../../db/temp/videos'))
            fs.mkdirSync(path.join(__dirname, '../../db/temp/videos'))

            const randomVideo = await this.randomVideo()
            await this.concatAudios()
            await this.createVideo(randomVideo)
        }

        /**
         * Retrieves a random video from the video directory.
         * @returns {Promise<string>} A promise that resolves to the path of the random video.
         */
        public static async randomVideo(): Promise<string> {
            const videoDir = path.join(__dirname, '../../db/videos')
            const files = fs.readdirSync(videoDir)
            const randomIndex = crypto.randomInt(0, files.length)
            const randomVideo = files[randomIndex]
            return randomVideo as string
        }

        /**
         * Concatenates the title and story audio files into a single output file.
         * @returns A Promise that resolves when the audio files are successfully concatenated.
         */
        public static async concatAudios(): Promise<void> {
            const titleMP3Path = path.join(__dirname, '../../db/temp/audio/title.mp3')
            const storyMP3Path = path.join(__dirname, '../../db/temp/audio/story.mp3')
            const outputPath = path.join(__dirname, '../../db/temp/videos/output.mp3')
            await StefanAPI.Audio.concat([titleMP3Path, storyMP3Path], outputPath)
        }

        /**
         * Creates a video with the specified background video.
         * Ported over from the previous app, better made.
         * Will be better documented
         * @param bgVideo The URL or path of the background video.
         */
        public static async createVideo(bgVideo: string) {
            // Intitial data
            const outputDir = fs.readdirSync(path.join(__dirname, '../../output'))
            const amountOfVideosInOutputDir = outputDir ? outputDir.length + 1 : 0
            const subttilesPath = '../../db/temp/subtitles/subtitles.ass'

            // Whole audio of video data
            const wholeAudioPath = path.join(__dirname, '../../db/temp/videos/output.mp3')
            const wholeAudioDuration = spawnSync('ffprobe', [
                '-v', 'error', '-show_entries',
                'format=duration', '-of',
                'default=noprint_wrappers=1:nokey=1',
                wholeAudioPath]).stdout.toString()

            // Overlay data
            const overlayImagePath = path.join(__dirname, '../../db/images', fs.readdirSync(path.join(__dirname, '../../db/images'))[0]!)
            const overlayAudioPath = path.join(__dirname, '../../db/temp/audio/title.mp3')
            const overlayAudioDuration = spawnSync('ffprobe', [
                '-v', 'error', '-show_entries',
                'format=duration', '-of',
                'default=noprint_wrappers=1:nokey=1',
                overlayAudioPath]).stdout.toString()

            // Paths of Videos
            const overlayBgVideoPathNoOverlayPath = path.join(__dirname, '../../db/temp/videos/overlayBgVideoNoOverlay.mp4')
            const videoWithOverlayAppliedPath = path.join(__dirname, '../../db/temp/videos/videoWithOverlayApplied.mp4')
            const videoFromOverlayEndToWholeVideoEndPath = path.join(__dirname, '../../db/temp/videos/videoFromOverlayEndToWholeVideoEnd.mp4')
            const subtitledVideo = path.join(__dirname, '../../db/temp/videos/subtitledVideoFromOverlayEndToWholeVideoEnd.mp4')
            const concatenatedOverlayVideoWithWholeSubtitledVideoPath = path.join(__dirname, '../../db/temp/videos/concatenatedOverlayVideoWithWholeSubtitledVideo.mp4')
            const outputVideoWithAudio = path.join(__dirname, '../../output', `story${amountOfVideosInOutputDir}.mp4`)

            // ? Begin Creation
            // * Trim a temporary video from 0 to overlayDuration
            await StefanAPI.Video.trim(path.join(__dirname, `../../db/videos/${bgVideo}`), overlayBgVideoPathNoOverlayPath, 0, parseFloat(overlayAudioDuration))

            // * Apply the overlay to the temporary video
            spawnSync('ffmpeg', [
                '-i', overlayBgVideoPathNoOverlayPath,
                '-i', overlayImagePath,
                '-filter_complex',
                '[0:v][1:v] overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2',
                '-c:v', 'libx264', '-crf', '0',
                '-pix_fmt', 'yuv420p', '-y', videoWithOverlayAppliedPath],
                { cwd: __dirname })

            // * Trim another video from overlayDuration to audioDuration
            await StefanAPI.Video.trim(path.join(__dirname, `../../db/videos/${bgVideo}`), videoFromOverlayEndToWholeVideoEndPath, parseFloat(overlayAudioDuration), parseFloat(wholeAudioDuration))

            // * Concatenate the overlay video with the whole video
            spawnSync('ffmpeg', [
                '-i', videoWithOverlayAppliedPath,
                '-i', videoFromOverlayEndToWholeVideoEndPath,
                '-filter_complex', '[0:v][1:v] concat=n=2:v=1:a=0',
                '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p',
                '-y', concatenatedOverlayVideoWithWholeSubtitledVideoPath
            ], { cwd: __dirname })

            // * Add subtitles to the video
            spawnSync('ffmpeg', [
                '-i', concatenatedOverlayVideoWithWholeSubtitledVideoPath,
                '-vf', `ass=${subttilesPath}`,
                '-c:a', 'copy',
                '-y', subtitledVideo
            ], { cwd: __dirname })

            // * Add audio to the video
            await StefanAPI.Video.addAudio(subtitledVideo, wholeAudioPath, outputVideoWithAudio)

            console.log(chalk.green('✅ Created Video!'))
        }
    }
}

await RedditStoryGenerator.Main.main()