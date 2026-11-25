# Speaker notes: how a language model answers

About 10 minutes. Each scene plays for 10-30 seconds and then holds on its last
picture; talk over that picture, then press next.

**Keys:** Right arrow / Space / Page Down = next scene. Left arrow / Page Up =
back (shows the finished picture). R = replay the scene. F = fullscreen.

**The one idea to land:** an AI chat model does one small thing, guess the next
piece of text, and repeats it very fast.

**What is real and what is drawn:** the token pieces and their ID numbers are
real (from the GPT-4 tokenizer). The attention lines and the percentages are
drawn by hand to show the idea.

---

## 1. What happens inside? (20 s)

On screen: a chat window, the sentence is typed, the answer "tired." comes
back. Then it becomes: prompt -> closed box with "?" -> answer.

- You have all used a chat AI. You write something, and text comes back.
- The text you write is called the **prompt**.
- Today we open the box in the middle. There are three steps inside.
- Ask the class first: "The dog didn't cross the street because it was too...
  what?" Collect a few answers. You will use them again in scene 5.

## 2. Words become tokens (25 s)

On screen: the sentence turns into coloured boxes, then each box shows a
number.

- A computer cannot read words. It can only work with numbers.
- So the text is cut into small pieces called **tokens**. Most short, common
  words are one token.
- Look at "didn't": one word, but two tokens. The model has a fixed list of
  about 100,000 pieces, and it builds every text from that list.
- Each piece has a number on that list. From here on, the model only sees the
  numbers: 791, 5679, 3287...

If asked:

- *Why not one number per word?* There are too many words, and new ones appear
  every day. With pieces, the model can build any word, also names and typos.
- *Why not one number per letter?* That works, but then the text becomes very
  long, and the model is slower.

## 3. And in German? (10 s, optional)

On screen: "Donaudampfschifffahrtsgesellschaft" (Danube steamship company)
breaks into 13 pieces.

- The list of pieces was made mostly from English text, so common English words
  get one piece.
- A long, rare German word is not on the list. The model has to build it from
  many small pieces: 1 word, 13 tokens.
- The model can still read it. It just needs more pieces, so it costs more
  work.

Skip this scene by pressing next twice if you are short on time.

## 4. Layers and attention (30 s)

On screen: the tokens climb through four bands. In each band, lines go from the
word "it" back to the earlier words. At the top, the line to "dog" is thick.
Then the last word, "too", draws its own yellow lines back over the sentence,
and an empty "?" box appears after it.

- The model is a stack of **layers**. The tokens go in at the bottom and move
  up, one layer at a time. Every layer changes them a little.
- At the start, each token only knows itself. The word "it" does not know what
  "it" is. The dog? The street?
- **Attention** is how a token finds out. In every layer, each token looks back
  at the words before it and asks: "Which of you help me understand myself?"
  Then it takes a little information from them, more from the useful ones.
- The lines show where "it" is looking. Thick line = looking hard. Low layers:
  a little bit at everything. Higher layers: mostly at "dog", and a bit at
  "street".
- At the top, the model's "it" really means "it, the dog". Nobody told the
  model this rule. It learned it from reading a huge amount of text.
- Yellow lines: the guess for the next word is made at the **last** word,
  "too". It also looks back. It picks up "it" (which now means the dog),
  "didn't cross" and "was too". So at the top, "too" holds a small summary:
  a dog, did not cross, was too ... what? That summary becomes the "?" box.

To remember: "it" shows how the model *understands* the sentence. "too" is
where the *guess* comes from. Both use the same trick, attention.

A line to say out loud: "Each word asks: which earlier words help me understand
myself? Then it borrows a little from them."

If asked:

- *Does only "it" do this?* No. Every token does it, at the same time, in every
  layer. The picture follows one word so you can still see something.
- *Why are there no blue lines to "was" and "too"?* A token can only look
  back, at words that come before it.
- *Why is the guess made at "too" and not at "it"?* Every position guesses the
  word that comes after it. The top of "it" would guess "was", which we already
  have. Only the last position guesses something new.
- *Are there really four layers?* No. Real models have dozens of layers, and
  each layer has many sets of these lines. Four fit on the screen.
- *Are those the real lines?* No, they are drawn by hand to show the idea.

## 5. Picking the next word (30 s)

On screen: bars with percentages (tired 41%, wide 22%, ...). The bars bend into
a wheel. The wheel spins and stops on "tired", which joins the sentence. The
longer sentence goes back into the model, the wheel spins again, and "." comes
out.

- The model does not answer with one word. It answers with a list: every piece
  it knows, each with a chance. Compare the bars with what the class guessed in
  scene 1.
- The part that picks one is called the **sampler**. Think of a wheel of
  fortune where a bigger chance gets a bigger slice.
- "tired" is the most likely word, so it usually wins, but not always.
- Then comes the important part: the new word is added to the sentence, and the
  whole sentence goes through the model again for the next piece. One piece per
  turn.
- A long answer is this loop, hundreds of times. That is why you see the text
  appear word by word in a chat.

If asked:

- *Why not always take the top word?* You can. But then the model always says
  the same thing, and its text becomes boring and repeats itself. A little
  chance makes it sound more natural.
- *What is "other"?* All the other pieces on the list together. Each one has a
  very small chance.

## 6. Again, and again (20 s)

On screen: everything once more, fast. This time the wheel stops on "wide".
Final picture: the same sentence with two endings, "tired." and "wide.", and
the line "AI guesses the next word, again and again."

- Same prompt, same model, different answer. This is why a chat AI gives you a
  different text when you ask the same question twice.
- Notice that "wide" changes the meaning: now "it" is the street, not the dog.
  The model did not decide what is true. The wheel decided.
- So: an AI is very good at guessing what comes next. Often the guess is right.
  Sometimes it sounds right and is wrong. That is why you should check
  important answers.
- Close with the line on screen, then take questions.
