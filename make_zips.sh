#!/bin/sh
rm oarstrongMAD-browser.zip
rm oarstrongMAD-dev.zip
zip -r oarstrongMAD-dev.zip index.html sprites/*.png sounds/*.wav sounds/*.mp3 sounds/*.ogg js/*
cp oarstrongMAD-dev.zip oarstrongMAD-browser.zip