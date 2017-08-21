import express from 'express'
import 'colors'
import http from 'http'
import tgBot from 'node-telegram-bot-api'
import redis from 'redis'
const
  app = express(),
  httpServer = http.createServer(app),
  config = require('./config.json'),
  token = config.token,
  bot = new tgBot(token, { polling: true }),
  client = redis.createClient()

client.on("error", err => console.log(`Error`.red, err))

async function start() {
  console.log(`...Starting`)
  let { from } = await new Promise(resolve => bot.onText(/\/start/gi, resolve))
  if (await defineAccept(from)) {
    await identifyCity(from)
    await identifySalaryRange(from)
    await identifyType(from)
    await identifyMessage(from)
  }
}

async function defineAccept(from) {
  await bot.sendMessage(from.id, `Окей, ${from.first_name}, этот бот предназначен для упрощения создания вакансий в чате JS Jobs? Начнем? (введите да)`)
  let answer = await new Promise(resolve => bot.onText(/да/gi, resolve))
  return answer
}

async function identifyCity(from) {
  await bot.sendMessage(from.id, `${from.first_name}, введите город через слеш. Пример: /Москва, /Санкт-Петербург`)
  let { text: chosenCity } = await new Promise(resolve => bot.onText(/./, resolve))
  console.log(`chosenCity`, chosenCity)
  if (chosenCity === "Москва") {
    await bot.sendMessage(from.id, `Выбран город Москва. Введите станцию метро.`)
    let { text: chosenMetro } = await new Promise(resolve => bot.onText(/./, resolve))
    await bot.sendMessage(from.id, `Выбран город Москва. Метро ${chosenMetro}`)
  } else {
    await bot.sendMessage(from.id, `Выбран город ${chosenCity}`)
  }
}

async function identifySalaryRange(from) {
  const salaryRange = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "50-100k", callback_data: "50k-100k" }],
        [{ text: "100k-150k", callback_data: "100k-150k" }],
        [{ text: "150-200k", callback_data: "150k-200k" }],
        [{ text: "250k-300k", callback_data: "250k-300k" }],
        [{ text: "Другое", callback_data: "moar" }]
      ]
    })
  }
  await bot.sendMessage(from.id, "Начнем с вилки", salaryRange)
  let { data: chosenRange } = await new Promise(resolve => bot.on("callback_query", resolve))
  if (chosenRange === "Другое") {
    await bot.sendMessage(from.id, `Вы выбрали другую вилку. Какую?`)
  } else {
    await bot.sendMessage(from.id, `Вы выбрали вилку ${chosenRange}`)
  }
}

async function identifyType(from) {
  const specialities = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "Frontend", callback_data: "frontend" }],
        [{ text: "Backend", callback_data: "backend" }]
      ]
    })
  }
  await bot.sendMessage(from.id, "Frontend или Backend?", specialities)
  const { data: chosenSpec } = await new Promise(resolve => bot.on("callback_query", resolve))
  if (chosenSpec === "frontend") {
    await bot.sendMessage(from.id, "Вы выбрали frontend. (reactjs, angularjs, emberjs, backbone, extjs)")
  } else if (chosenSpec === "backend") {
    await bot.sendMessage(from.id, "Вы выбрали backend (nodejs)")
  }
}

async function identifyMessage(from) {
  await bot.sendMessage(from.id, "Введите сообщение к вакансии, чтобы соискатели могли получить более детальную информацию о вакансии")
  let message = await new Promise(resolve => bot.onText(/\//, resolve))
  console.log(`message`, message)
  const answers = {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "Нет", callback_data: "0" }],
        [{ text: "Да", callback_data: "1" }]
      ]
    })
  }
  await bot.sendMessage(from.id, "Готово. Опубликовать?", answers)
  let { data: answer } = await new Promise(resolve => bot.on("callback_query", resolve))
  console.log(answer)
  if (Number(answer)) {
    await bot.sendMessage(from.id, "Вакансия будет опубликована в js jobs feed.")
  } else if (!Number(answer)) {
    await bot.sendMessage(from.id, "Не опубликовываем, вакансия будет стерта. Удачи.")
  }
}

start()