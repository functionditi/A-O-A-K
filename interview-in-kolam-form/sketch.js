// Global variables & arrays:
let pullis = [];       // List of all grid dots.
let framework = [];    // Each edge: { x: currentIndex, y: nextIndex, reverse: bool, vector: {dx,dy}, word }
let capArcs = [];      // Cap arcs drawn when terminating a branch.
let startingPoints = [0];  // Dot 0 is the initial starting point.

//let size = 18;          // Grid is size x size.
let rows=9, cols=18;
let spacing = 80;      // Spacing between grid dots.

let dfsStack = [];     // Current DFS stack (indices).
let visited = new Set();
let lastVector = null; // Stores the most recent movement vector.
let colormode;

let currentSpeaker = null; // will hold "Aditi" or "Aarati"


// Graphics layers:
let gridLayer, drawingLayer, pointerLayer;

let speakerDiv;


let red="#ef4b41";
let blue="#3264a6";
let yellow="#e4c753"
let lightblue="#b8d9d5";
let sw=6;
// ------------- TRANSCRIPT TEXT -------------
// Replace the text below with your full transcript.


let transcriptText = `

Aditi Thank you so much for joining this call. I'm Aditi, a creative technologist currently based in Singapore, originally from Bangalore. I'm half Telugu, half Bengali. I've been following your work for a while and noticed how Telugu cultural elements, like creating a kolam or muggulu, are deeply present in it / . 

Aarati I was researching kolams and came across Dr. Gift Siromoney’s work, as well as other mathematicians studying kolams. At the same time, I was thinking about encryption—not just as a way to store or transmit data, but as a ritual itself.
Kolams have been a regular practice in my family. Traditionally created by women, they are an art form in their own right. My interest in connecting kolams with encryption began when my grandmother passed away. I wanted to encrypt her name into a kolam as a mourning ritual for myself. The existing mourning rituals in my family followed a more patriarchal lineage, honoring my grandmother’s mother-in-law and her mother-in-law’s mother-in-law. I wanted to take a different approach and honor the maternal lineage instead / .

Aditi That’s fascinating. Before starting this project, I was interested in conditional design—a concept where a set of instructions guides the creation of an artwork, similar to Sol LeWitt’s approach. In our case, these instructions are embedded in daily rituals, passed down through generations.
My parents weren’t deeply immersed in culture or religion, so this project—exploring kolams through tangible interactions and human-machine interaction—feels like a process of rediscovery. I wouldn’t call it reclaiming, but rather reconnecting.
Since kolams are passed down matrilineally, I’m curious about how you’ve navigated bringing this lineage into public conversations through art and technology. It often feels like a hidden practice—does it feel that way to you? How has translating this into your art been received / ?

Aarati Since working on the project with my grandmother, I’ve expanded the types of messages encrypted in kolams. People have reached out with requests for custom kolams, and I now create prints with messages spanning various themes. Some kolams contain personal dedications to family members, while others hold political messages—for instance, one says, From the river to the sea in reference to Palestine. The project has evolved to incorporate different narratives, allowing me to expand its reach and impact. I don't know. Did that answer the question / ?

Aditi Yeah, I was asking how you've navigated bringing this lineage into a more public or collective space, engaging with people who may not have seen kolams before. Does that make sense / ?

Aarati Yeah. A few things have been helpful. It's definitely interesting bringing something that, while not exactly a secret, is traditionally practiced in a domestic space and then moving it into a gallery. There’s something funny about that. What has helped, especially with the computational kolams, is having so much of the project exist online, through a screen, or as two-dimensional prints. But actually performing the act—drawing kolams on the ground with rice flour—has been really helpful for giving context. The most recent iteration at Spill was interesting because Spill is technically someone’s home, which brings the practice back to a domestic space / .

Aditi That’s great, because the placement of a kolam or rangoli is so important—it’s usually at the threshold of a space. So it's really cool that you did it in someone’s home. I also wanted to ask about the embodiment and physicality of drawing a kolam. I did a visual study where I tried to understand the gestures, the pinching technique, and the materials used. Growing up in Bangalore, I saw kolams all the time in my neighbors’ homes, but my own household never practiced it. In Singapore, space is limited, so people don’t always have free access to corridors or hallways where kolams would typically be drawn.
I noticed in one of your Instagram posts that you etched a kolam into a banana leaf, which I thought was really interesting. I’m trying to understand how the physicality of a kolam is tied to its existence. If a kolam isn’t constructed with the same craftsmanship or technique, is it still valid? If there’s a spectrum between traditional kolams and more screen-based versions, where does validity lie? That’s the underlying question I’m exploring / .


Aarati As I developed the web-based part of the project, I realized that time is a really important element. Even the prints I made take a long time because of the tile-based system I use for letterpress printing. Drawing a kolam on the ground also takes time. The physical act of drawing is meditative. I’m not very religious, and I have ethical issues with the way my family practices religion, but I still see value in the act of slowing down and making something.
That idea translated into the digital space as well. When I was thinking about how to decode the kolams, I intentionally avoided just putting a label on them. Instead, I made a website where users have to touch every tile or point to decode it. The point isn’t just to read the kolam—the time spent interacting with it becomes a form of meditation or reverence for the message or name embedded in it / .

Aditi That resonates with me. When I was drawing kolams with pen and paper, I started by placing the grid of dots, then challenged myself to connect everything with a single continuous line. I turned it into a game—symmetry was one aspect, but I also experimented with increasing the number of dots and testing different ways to construct the kolam. I completely understand what you mean about the meditative process, whether it’s physical or digital.
I also wanted to ask about the translation process. You started by translating your grandmother’s name into a kolam—was that the first one? Were there any trade-offs or tensions that came up when you were encoding the kolam in binary / ?

Aarati There were a lot of interesting rabbit holes in how non-Latin characters are encoded in binary. If I translated my grandmother’s name in Telugu script, it became much more complex because of how non-Latin characters are structured. In binary, Latin characters are encoded with 8 digits per letter. But in Telugu, what we consider one letter can take 16 or 24 digits because of how the script is adapted to fit a system optimized for Latin characters. That exposed some of the biases in character encoding systems / .
Another trade-off was the orientation of the kolams. Traditional kolams are drawn in a radial manner, not in a strict top-to-bottom, left-to-right order like the ones I created. If I redid the project, I’d want to find a way to make them feel less directional / .

Aditi That makes sense. I was trying to write a p5.js script that mimicked the flow of how a kolam is drawn rather than using a tile-based approach. When I draw by hand, it feels intuitive, but with code, I have to break everything into structured instructions. You mentioned making your kolams top-to-bottom and left-to-right—there are so many ways to generate a kolam, but when working with technology, you have to collaborate with it rather than just doing it freely. I’m trying to find ways to bring authenticity into my project while working within these constraints.
A follow-up question: How do you balance the strict structure that code requires with the creative and intuitive choices of the process / ?

Aarati With kolams, I didn’t have a regular practice of drawing them before, so I was learning while coding. Breaking things into concrete steps for the program was also a way for me to understand kolam structures better. It didn’t feel like a balancing act so much as a deeper exploration. But yes, the process highlights the difference between learning through muscle memory versus over-theorizing through structured instructions / .

Aditi Do you have a background in computer science, coding, mathematics, or design? How did you get into creative technology and computational design / ?

Aarati I studied industrial design as an undergrad, then learned to code at a boot camp. I started making websites, which eventually folded into my creative practice. Later, I went to grad school for creative coding and design technology / .

Aditi Do you speak or write Telugu / ?

Aarati I’m not fluent, but I know a little of both / .

Aditi I feel like navigating our connection to culture is interesting, especially in more Westernized environments. Do you think computation is inherently Western, given the way character encoding favors Latin characters? How can artists and technologists decolonize these tools / ?

Aarati Binary systems exist outside the West—like in Yoruba Ifá traditions and the I Ching in China. Computation isn’t inherently Western; it’s just been framed that way. Expanding our understanding of computation reveals multi-vocality—kolams are a form of coding. Even though I work in New York, I see similar traditions from other cultures, which broadens the conversation / .

Aditi Do you show your work to your family / ?

Aarati Not frequently, but they saw my exhibition yesterday. They’re supportive but sometimes confused. My aunt even gave me a tutorial before I performed a kolam. They see it more as a math problem than as art, but they’re willing to engage, which leads to interesting conversations / .

Aditi Just now, you mentioned the act of performing the making of a kolam. We've also talked about physicality and how meditative that process can be. Could you tell me more about your experience with it from a performance art perspective / ?

Aarati Yeah, I think this relates to your earlier question about bringing the kolam into an art world space and giving people context for it. I’ve been calling the drawing of it a performance mainly because in spaces where people don’t necessarily have a context for it, it helps set expectations. It signals that something physical is going to happen—someone is going to do something with their body, and there’s a process involved that people will witness. That framing has been helpful in preparing people for what they’re about to see.
When I’m actually drawing, seeing the process in action helps people understand how it works. The computational aspect is very tile-like, but when someone sees it being drawn—how the lines connect—it just clicks for them more easily / .

Aditi That makes sense. One thing I’ve been really interested in is the ephemeral nature of kolams or rangolis—the act of making one every day and then having it wiped away as the day progresses. It dissipates, rather than disintegrates. I’ve been thinking about how to translate that aspect into physical computing or interactive experiences where people in Singapore can create their own kolams and understand the practice. Does that ephemeral quality play a role in how you translate kolams into digital or gallery spaces / ?

Aarati In some ways, the prints and web-based parts of my project are quite different from the ephemeral nature of an actual kolam on the ground. But I think there’s still something about the generative aspect—how you can have nearly infinite permutations—that relates to that ephemeral quality. The process of constant creation and variation feels connected to the traditional practice, even if the medium is different.
That’s also why it was important for me to draw one in the space rather than just having screens or printed pieces. Seeing the kolam change over time is crucial to understanding its nature / .

Aditi Yeah, especially in a Western gallery context, which is very much about the "white cube"—look, don’t touch / .

Aarati Exactly. This time, we were able to do it on the ground, which was nice. But in other spaces, I’ve had to use a platform because there was no way to draw directly on the floor / .

Aditi That makes sense. After all your experimentations and experiences with creating kolam codes, what’s your favorite part of it? What do you enjoy the most / ?

Aarati I think expanding the project to involve other people has been really fulfilling. People have asked me to make prints for them, and for the exhibition, we invited Sai Priya, who runs the archive, to create a zine that we included in the space. The conversations I’ve had and the people I’ve met and collaborated with have been the most exciting part / .


Vijaya SingaRangoli is my company. Before that, it was varnamila.com. It started in 2007 or 2008. In 2015, I began experimenting with a lot of innovations, so I renamed it SingaRangoli / .

Aditi My name is Aditi. I moved to Singapore four years ago. I studied design communication at LASALLE College of the Arts, which is very close by. I now work at a research studio funded by the Singapore Institute of Technology. Alongside that, I’m working with the Singapore Art Museum on a design research fellowship. I have a background in technology and design, and my current project explores how traditional art forms, such as rangolis, can survive and evolve in a world dominated by technology. I was curious about the rangoli scene in Singapore and did some research. My mother was Bengali, and my father is Telugu, so I grew up with a mix of cultural influences. At home in Bangalore, we only created kolams or muggu during Deepavali, not on a daily basis. Last Deepavali, I had a question: how has this art form evolved in Singapore, where space is limited? Many households don’t have driveways, unlike in India. I’m curious about how rangoli is practiced here and how technology can assist in its creation while preserving its handcrafted nature. Thank you for agreeing to this interview. I understand you hold a Guinness World Record from 2003 in Wampoa, Singapore. My first question is: when did you start creating rangolis in Singapore / ?

Vijaya I started making rangolis at the age of five, learning from my mother. We created them outside our house every day. I was born and raised in Trichy, Srirangam, a small town in Tamil Nadu. During the Margazhi festival, we made elaborate, large designs. I would walk through the streets, taking note of new designs I hadn’t seen before. That became my practice as a child. After I got married, I moved to Mumbai. Even though we lived in a flat, I continued to draw small rangolis outside every day. One of my lecturers at Bombay University was impressed with my designs and invited me to draw rangolis at events whenever international guests visited. I created rangolis in hotels and venues like the Nehru Planetarium. I migrated to Singapore with my family in 1992. We lived in a flat, but I maintained my daily ritual: waking up, cleaning the doorstep, and creating a small rangoli with rice powder. The most fulfilling part was seeing birds come to eat the rice powder each morning. Rangoli has many meanings and purposes. I became deeply invested in learning about it—how people practice it in different states of India, the various techniques used, and the reasons behind each tradition. Rangoli has different names across regions, like muggu in Andhra Pradesh. Even in Africa, there are similar practices where people create nature-based rangolis using stones and other materials for festivals. While in Singapore, I pursued a master’s degree in art therapy at LASALLE in 2006–2007. I began incorporating rangoli as a therapeutic practice in hospitals, old-age homes, and children’s homes. Even now, I continue using rangoli in therapy. From 2015 onward, I focused on community involvement—teaching Singapore’s multi-racial communities how to create rangoli art. I transitioned rangoli from floors to tables, then from tables to walls, and now even to ceilings. It remains a traditional design, but I use contemporary materials. More recently, I’ve incorporated recycled materials due to the growing focus on sustainability. Seeing so much waste, I began repurposing discarded items into decorative rangoli art / .

Aditi I think the exhibition you have right now is a great example of cross-cultural expression in Singapore. You’ve combined Ang Paos, which are traditionally Chinese, with Deepavali and rangoli. What was the process like for creating this exhibit / ?

Vijaya I have collaborated with around 20 organizations. I am currently the president of the Rotary Club of Novena, but even before that, I engaged in numerous community projects. I organize about four to five projects a year. I enjoy involving the community and working with various materials, including earbuds, toothpicks, spoons, forks, small mirrors, and even clay pots from India. I also designed a puzzle rangoli for stroke and dementia patients, allowing them to interact with and assemble the artwork / .

Aditi What is your process for making them weatherproof? Do you spray them with a fixative / ?

Vijaya I use a special glue. My husband is a chemical technologist specializing in adhesives. He developed a unique glue formula, which I use to assemble and color the materials before arranging them into rangoli designs. This method ensures durability, allowing the rangoli to remain intact for months / .

Aditi You mentioned that when you were younger, you observed different types of rangolis and researched them across different countries. For this exhibition, how do you decide on the design of the rangoli / ?

Vijaya I adapt based on the crowd. I often work with seniors, individuals with mental illnesses, and people with special needs. I first teach them to create roses by rolling Ang Paos.. Once they finish making the roses, I design the layout and guide them in pasting the roses onto the rangoli. I cannot teach them everything in a day, and they may not have the patience to learn rangoli in its entirety. But involving them in the creation itself is significant. That’s why I structure my workshops this way. I am also a member of the International Flower Carpet Association. In 2022, I was invited to join after showcasing my work in Brazil and Brussels. In Brussels, they create massive flower carpets outside the palace, spanning 100–200 meters with thousands of participants. The president of the association saw my work and invited me to be a part of the Brussels Flower Carpet from 2022 onwards. Since then, I have traveled to Japan, Barcelona, Mexico, Italy, and Rome, among other countries, to create rangolis. Recently, I was invited to Florida, but I had to decline due to Deepavali commitments in Singapore. I prioritize decorating for Deepavali here before taking on international projects. From Deepavali until Pongal, I do not travel, as I focus on community exhibitions, migrant worker outreach, and cultural programs, including clapping yoga for seniors and migrant workers / .

Aditi It seems like you use rangoli as a medium to bond with the community / .

Vijaya Yes, I also use it as a therapeutic tool. I organized a large exhibition at Sengkang Hospital, Bright Vision Hospital, and Singapore General Hospital. I worked with patients, doctors, and visitors who were coming in for appointments. They would do rangoli before their appointments and then go back. Seniors often come early for their appointments and feel anxious about their health conditions. After doing rangoli, they felt very happy and relaxed. Many of them asked me why I couldn’t be there permanently because they found it so calming / .

Aditi I read one of your interviews in The Straits Times where you mentioned that making rangolis is very meditative and calming. I have been studying the history of the gestures used in rangoli, particularly when working with traditional materials like rice flour, as well as synthetic colored powders used today What are your thoughts on the meditative aspect of rangoli? How long does it typically take you to create one / ?

Vijaya Symmetry is very important in rangoli, especially for pooja. Creating symmetrical patterns involves repetition, which helps compose the brain and increase focus. The process requires full attention—you forget everything else while working on a symmetrical design. It is similar to yoga. When you press your fingers together in a Chin Mudra, it stimulates the five elements—air, earth, fire, water, and space—because all our fingertips correspond to different elements. The colors of the rangoli enter through the eyes, stimulating the nervous system and chakras. Visually and sensory-wise, it provides stimulation. Emotionally, seeing the finished product brings happiness and satisfaction. The entire process offers emotional balance, psychological well-being, and physical engagement / .

Aditi Rangoli-making is quite physical, isn’t it / ?

Vijaya Yes, because you have to bend and work on it. I am 65 years old, and I can still bend for 8 hours, though I do it less now due to surgery. But with practice, it becomes second nature. The process itself brings happiness / .

Aditi Rangolis are not permanent. How do you view this impermanence / ?

Vijaya Beauty is not permanent; it is temporary. That is the underlying concept. Spiritually, it is an offering to God, a form of thanksgiving. You cannot take it with you. It is about appreciating the moment and expressing gratitude for the opportunity to create something beautiful. There are also deeper lessons—when you bend to make a rangoli, you are practicing humility and learning to adapt to situations in life. Traditionally, early morning rangoli-making with rice flour feeds small insects like ants and birds. Charity begins in the morning / .

Aditi That’s interesting! I initially thought it was a pest control method / .

Vijaya Yes, in traditional practices, cow dung was used to clean outdoor spaces. It acts as a natural pesticide, keeping away cockroaches, flies, and mosquitoes / .

Aditi There are different levels of traditionality. I also read that rangolis can indicate the health of a household / .

Vijaya Yes, it is believed that drawing a rangoli in the morning drives away evil spirits. It also invites divine blessings. Lakshmi, the goddess of prosperity, is believed to enter a house adorned with rangoli. Squares are associated with her seat. Upward triangles symbolize males, while downward triangles symbolize females / .

Aditi When technology is integrated into rangoli-making, do you think it affects authenticity? What do you consider the essence of a rangoli / ?

Vijaya Rangoli is nature-inspired design. People now refer to similar patterns as mandalas or Zentangles, but these designs have always existed. Rangolis follow specific patterns for different occasions and days. For example, on Fridays, we create Padi Kolam. During festivals like Deepavali, we design rangolis to bring joy to visitors . Today, even portraits are made using rangoli techniques. The essence lies in the process and interpretation. Some may not recognize a design as rangoli, but for those who understand the art, it carries deeper meaning / .

Aditi I use an AxiDraw pen plotter. If I ask it to draw a rangoli, is it just imitating one, or is it a real rangoli / ?
Vijaya It depends on how you see it. Some people use vibrating plates with powder to create patterns—this is still a form of rangoli. What matters is the intention and interpretation behind it / .

Aditi I worry that integrating technology into rangoli may cause the loss of traditional practices / .

Vijaya I create rangolis on a computer and even made an app for digital rangoli. It depends on who you are teaching and how you engage them. If someone is comfortable with digital tools, they can still learn the designs and their significance. The goal is to preserve and spread awareness. Whether on the floor or a screen, rangoli remains rangoli / .

Aditi Do you feel that younger generations are preserving rangoli / ?

Vijaya We can preserve it through exhibitions and workshops. I have held exhibitions in New York, Taiwan, and multiple locations in Singapore. By using different materials and reaching diverse audiences, I am trying to bring rangoli to as many people as possible / .

Aditi This has been a wonderful conversation. Thank you so much for your time / !


Aditi Thanks so much for your time today. I've been following your work and research, and I’m really looking forward to hearing your thoughts. I’m very grateful we could set up this meeting, so thanks once again / .

Nagarajan Of course. Anyone interested in the kolam in a deep way, I’m always interested in talking to / .

Aditi Amazing. I’ll start by giving a quick introduction to my research. My name is Aditi, and I’m from Bangalore, India. I grew up half Telugu and half Bengali and moved to Singapore in 2020 to pursue design, studying computational design at LaSalle. Last year, during Deepavali, I found myself drawn to the idea of representing rangolis as a broader artwork or art form through computational means. The more I explored, the more I realized there are so many rule sets that dictate how rangolis, kolams, mugulus, or any pookalams should exist. That got me curious about their creation process. I decided to focus my exploration on the kolam or mugulu. These art forms involve intentionality in every step, from choosing the initial patterns, colors, motifs, and materials to the physical act of making them, which is a highly tactile and sensorial experience. It’s deeply ingrained in cultural significance. My research looks into how human creativity, intentionality, and physicality in these art forms can be expressed through generative design, physical computing, or human-machine interaction while still preserving their integrity. I came across a passage in your work, "Even one's own tradition is not a birthright. It must be earned and possessed. One chooses and translates a part of it, making it present to oneself and maybe to others." This deeply resonated with me. This project feels like rediscovering the practice of making kolams or mugulus, despite my detachment from this aspect of culture. That thought has been a driving force behind my research, so I wanted to say thank you / .�
Nagarajan That quote is from one of my mentors, A.K. Ramanujan. He invited me to work with him at the University of Chicago on kolams, but due to circumstances, I couldn’t. However, we maintained a collegial and mentor-mentee relationship. He was a remarkable scholar, a MacArthur Genius Grant recipient, and his Sangam poetic translations are incredible. His perspective on tradition really resonated with me—this idea that tradition isn’t something automatically inherited but something one must actively engage with and understand. It requires mental, physical, and even spiritual effort to grasp the deep histories and complex permutations that exist within these traditions. Especially with kolams, which are primarily passed down orally rather than documented in texts, the knowledge is held by women, though a few men also practice it. The visual and technical knowledge exists in an oral and embodied form, making it incredibly rich and dynamic. I love that you connected with that quote—it really sets the tone for my entire book / .�
Aditi Exactly. One of the things I really appreciated about your research is how you speak about kolams from a deeply personal perspective while also amplifying the experiences of the women who practice them daily. You mentioned that many women can even make kolams in the dark because it has become an embodied interaction with the environment around them. That was particularly fascinating to me. I wanted to discuss this further, specifically through the lens of computational design and human-computer interaction. I’m curious, do you think any aspects of the kolam’s embodied or tactile nature might be lost in translation if it becomes screen-based or if the medium shifts to machines / ?�
Nagarajan That’s a fascinating question. Before answering, I’d like to understand more about what that means for you. What does computational design mean in this context, and what are the entry points for machines into kolam learning or transference / ?�
Aditi I approached this from two perspectives. First, kolams have a strong mathematical foundation, so I explored algorithmic generation. If you write a program to generate a kolam—let’s say using tile-based systems or array grammars—you can instantly create the image with a click of a button. There is intentionality in writing the code, but the process, the physicality of making it, is lost. That was one aspect I struggled with. Second, I took it further with a pen plotter connected to an Arduino and environmental sensors like a microphone and humidity sensors. These inputs influenced the kolam’s generation. This led me to question the balance of control—how much autonomy do we give the machine to generate the kolam, and to what extent should human elements dictate it? How do we preserve the physicality and intentionality behind actually drawing a kolam when approaching it through code and physical computing / .

Nagarajan I think that’s a really fascinating process. My first reaction is to ask, why? Beyond the fact that we can now do this, what is the purpose? What are we gaining from this translation? There are multiple ways to look at it. One way is to compare algorithmic kolams to plastic stick-on kolams. Both take something three-dimensional or even four-dimensional and flatten it into two dimensions. The stick-on kolam, which lasts for months, removes the ephemeral, daily ritual aspect of the practice. It alters the transient nature of the kolam and its engagement with time, space, and environment. Another crucial aspect is that kolams are not just aesthetics. One of the most knowledgeable people I interviewed in Madurai emphasized this to me repeatedly, "Do not ever forget that the kolam is not just aesthetics." Reducing the kolam to its pattern alone erases its deeper significance. The kolam is a choreographed movement of the body in space, and the physical act of drawing it at dawn is transformative. It marks a shift in time—the transition from darkness to light—and enhances awareness of the world around you. It’s not just about what is drawn but about what happens in the body, mind, and environment while making it. This embodied, daily practice is a form of communication. It signals the household’s openness, its capacity for generosity, and its ability to welcome strangers. This layer of meaning is not captured in a plastic kolam or an algorithmic one / .


Aditi That makes so much sense. This also ties into materiality. Kolams are drawn with rice flour, which feeds insects and small creatures. It’s a way of giving back, of acknowledging that when we build homes, we occupy space that was once home to other beings. If a kolam is generated by a machine or projected on a screen, does it remain a kolam, or does it become merely a representation of one? That’s something I’ve been grappling with / ?

Nagarajan That’s a critical question. Kolams are a ritual of generosity, performed on multiple levels. If we limit them purely to algorithmic generation, we lose the ability to step outside the contemporary mindset and gain the knowledge kolams offer us. They have the potential to critique the world we live in, offering alternative ways of seeing and acting. In this era of climate crisis, we need multiple ways of understanding the world, and kolams hold valuable insights that go beyond aesthetics or digital replication / .

Nagarajan It’s made me think deeply about what community means. It makes me reflect on how our actions, including mine, contribute to destruction—of the planet, of life. There is a natural cycle of life and death, but modern culture does not recognize that this cannot be infinite. We do not have the right to take life—whether human, animal, plant, mountain, river—infinitely / .�
Aditi That two-dimensional worldview—the flattening of meaning—also ties into the way we perceive climate change / .�
Nagarajan Exactly. I'm actually teaching a class on Hinduism and climate change, so I think about this daily. There’s a book I wanted to mention, Braiding Sweetgrass by Robin Wall Kimmerer. Do you know it / ?

Aditi No, but I’ll definitely check it out. It sounds like it explores indigenous knowledge as an alternative or complementary approach to modern systems / .�
Nagarajan Yes, exactly. And I saw your exhibit on plants—how you connected visitors with plants in a museum setting. That was fascinating. You were re-teaching people how to relate to nature / .�
Aditi I didn’t know you had seen that project! That means a lot. The inspiration came from Bangalore, where I grew up. It was once known as the Garden City but has rapidly urbanized. So much of its greenery has been lost to construction and expansion. That led me to think about how we might reconnect people with nature through tactile experiences—especially children. How do we encourage people to literally go outside and touch grass / ?

Nagarajan That project was beautiful. Its simplicity gave it power. It was almost shocking in a way, like a reminder that we’ve forgotten the language of nature and now must re-learn it from the ground up / .

Aditi That brings me back to my current research on kolams and computational design. Growing up, I saw how traditional practices in my family gradually faded. Space plays a role—both in Bangalore and Singapore. In Singapore, where I live now, space is scarce. Housing is dense, and public spaces are strictly regulated. For instance, in public housing (HDBs), hallways don’t belong to residents—they’re communal. You can’t place anything outside your door without violating regulations. Even in my condo, we received a notice for leaving our shoes outside. Singapore prioritizes uniformity, and in its attempt to balance multiculturalism, certain traditions are suppressed. This makes me wonder, how can we adapt this practice to dense urban environments like Singapore or Bangalore / .

Nagarajan That’s fascinating. So the space outside your home is essentially no one’s space / ?

Aditi Exactly. Unlike traditional Tamil homes, where the kolam at the threshold signals the household’s generosity, here there’s no space for it. This makes me wonder, how can we adapt this practice to dense urban environments like Singapore or Bangalore / .

Nagarajan That’s a really interesting question. I think there’s something about space—if you think about the doormat, for example. I don't know if it's the same in Singapore, but in the United States, people have doormats in front of their homes or apartments. It's acceptable because people need to wipe off snow or mud before entering. But beyond the doormat, there’s usually another space—the kolam space. That’s part of the modern space that doesn’t exist in the same way anymore.�I think there's a real loss of tenderness in community life. Sometimes, we need to do things without language. The kolam, in a way, engendered a language of tenderness. If someone wasn’t making a kolam, people would organize to bring food to their house because they probably didn’t have the capacity to cook or take care of themselves. It was an automatic language of need. It’s such a simple thing, and yet, how do you express love? It’s not just by saying, "I love you." It’s through action. Over the past year, I’ve seen how different friends understood what was needed at different moments. Ritual moments that stand outside of modernity make us human—birth, marriage, motherhood, death, these ceremonies exist in every traditional culture and even in modern ones. My children are also coming to this realization with Tamil. Even though their father was Swedish-Norwegian, they feel the need to hold onto Tamil because they know I won’t be around forever. None of us know how long we have. What are we going to leave behind? That’s why I’m glad I took my time writing the kolam book. It’s a book that will stand its ground because of the depth of time it required. People thought I was foolish for taking so long. My dad told me I would never finish it. He passed away before I finished, but on his deathbed, he told me that once I figured out the mathematics of the kolam, he knew I would complete the book. That chapter was incredibly challenging, and I kept avoiding it. Eventually, I had to do it. It took multiple talks and lectures to refine, but it’s now one of my best-known lectures / .

Aditi Your book is definitely going to stand the test of time. I’m working with the Singapore Art Museum, and they are deeply invested in cross-cultural understanding. Your book helps illuminate the beauty and value of the kolam. I’ve seen people engage with it in so many ways, especially online. I read an article recently analyzing the kolam as an eco-feminist practice, and they cited your work extensively. It’s inspiring / .

Nagarajan Thank you, Aditi. That means so much. 

`;



let transcriptWords = transcriptText.split(/\s+/);
let myFont;

function preload(){
  myFont=loadFont('../itf-trenches/PPMori-SemiBold.otf');
}

function setup() {
  createCanvas((cols + 1) * spacing, (rows + 1) * spacing);
  //background(187, 214, 213)
  background(228, 199, 83);
 // noLoop(); // We'll use redraw() on key presses.
1
  // Create separate graphics layers.
  gridLayer = createGraphics(width, height);
  drawingLayer = createGraphics(width, height);
  pointerLayer = createGraphics(width, height);

  //gridLayer.background(lightblue);

  // Set up gridLayer (permanent background).
  
  // if (currentSpeaker === "Aditi") gridLayer.background(lightblue);
  // if (currentSpeaker === "Aarati") gridLayer.background(yellow);
  //gridLayer.background(lightblue);
  gridLayer.fill(0);
  gridLayer.noStroke();

  resetPattern(); // Initialize state and grid dots.
  

  // Draw grid dots permanently.
  for (let i = 0; i < pullis.length; i++) {
    gridLayer.fill(getDrawingColor());
    gridLayer.ellipse(pullis[i].x, pullis[i].y, 5, 5);
  }

  // Initially render decorations (which may be just the starting DFS tip).
  renderPermanentLayer();
  drawPointer();
  redraw();

  drawingLayer.textFont(myFont);

  speakerDiv = createDiv("<p>Current Speaker: None</p>");
  speakerDiv.style("position", "fixed");
  speakerDiv.style("top", "20px");
  speakerDiv.style("right", "20px");
  speakerDiv.style("padding", "10px");
  speakerDiv.style("background-color", "white");
  speakerDiv.style("border", "2px solid red");
  speakerDiv.style("border-radius", "8px");
  speakerDiv.style("font-family", "PP Mori, sans-serif"); // ensure this font is loaded
  speakerDiv.style("font-size", "12px");  // set font size to 10px
  speakerDiv.style("max-width", "150px");
}

function draw() {
  
  // Composite layers: grid, permanent kolam pattern, then temporary DFS pointer.
  image(gridLayer, 0, 0);
  image(drawingLayer, 0, 0);
 // image(pointerLayer, 0, 0);
 if (frameCount%16==0) {
  
  let dir=int(random(2));
  switch(dir){
    case 0: extendSameDirection();
    break;
    case 1: extendTurn();
    break;
  }
  renderPermanentLayer();
  drawPointer();
  redraw();
 }
  
// } else if (key === '2') {
//   extendTurn();
  
}

// ------------- KEY HANDLING -------------
function keyPressed() {
  // Clear the temporary pointer layer.
  pointerLayer.clear();

  // Process key events:
  if (key === '1') {
    extendSameDirection();
  } else if (key === '2') {
    extendTurn();
  } else if (key === '0') {
    terminateBranch();
  }
  
  // After updating DFS state, re-render all permanent decorations.
  renderPermanentLayer();
  drawPointer();
  redraw();
}

// ------------- RENDERING THE PERMANENT KOLAM -------------
function renderPermanentLayer() {
  drawingLayer.clear();
  drawingLayer.push();
  let angleArray = [];
  // Loop through all framework edges and draw both the base line and decorations.
  for (let i = 0; i < framework.length; i++) {
    let edge = framework[i];
    let dot1 = pullis[edge.x];
    let dot2 = pullis[edge.y];
    
    // // Draw basic line.
    // drawingLayer.stroke(220);
    // drawingLayer.strokeWeight(sw);
    // drawingLayer.line(dot1.x, dot1.y, dot2.x, dot2.y);
    
    // Compute midpoint and angle.
    let tempX = (dot1.x + dot2.x) / 2;
    let tempY = (dot1.y + dot2.y) / 2;
    let r_angle = atan2(dot2.y - dot1.y, dot2.x - dot1.x);
    let angleDegrees = degrees(r_angle);
    angleArray.push(angleDegrees);
    
    // Draw decorations.
    if (startingPoints.includes(edge.x)) {
      drawLineByAngleOnLayer(drawingLayer, angleDegrees, tempX, tempY, spacing, true);
      drawingLayer.stroke(getDrawingColor());
      loopAroundOnLayer(drawingLayer, dot1, r_angle, PI / 4, PI * 7 / 4);
    } else {
      let prevA = angleArray[i - 1] || 0;
      let aDiff = angleDegrees - prevA;
      if (i % 2 === 1) {
        if (!(aDiff === 90 || aDiff === -270)) {
          applyLoopAndStrokeOnLayer(drawingLayer, aDiff, r_angle, dot1);
        }
        drawLineByAngleOnLayer(drawingLayer, angleDegrees, tempX, tempY, spacing);
      } else {
        if (aDiff === 90 || aDiff === -270) {
          applyLoopAndStrokeOnLayer(drawingLayer, aDiff, r_angle, dot1);
        } else if (aDiff === 0) {
          applyLoopAndStrokeOnLayer(drawingLayer, aDiff, r_angle + PI, dot1);
        }
        drawLineByAngleOnLayer(drawingLayer, angleDegrees, tempX, tempY, spacing, true);
      }
    }
    
    // Draw the word (if it exists) at the midpoint.
    if (edge.word && edge.word !== "" && edge.word !== "Aditi" && edge.word !== "Aarati" && edge.word !== "Vijaya" && edge.word !== "Nagarajan") {
      drawingLayer.noStroke();
      drawingLayer.textSize(18);
      drawingLayer.textAlign(CENTER, CENTER);
      
      let tw = textWidth(edge.word) * 2;
      let th = 25;
      
      if (edge.speaker === "Aditi") {
        // For Aditi: red rectangle with white border and white text.
        drawingLayer.fill(red);
        drawingLayer.stroke("#fff");
        drawingLayer.strokeWeight(2);
        drawingLayer.rect(tempX - tw / 2, tempY - th / 2, tw, th, 5);
        drawingLayer.fill(yellow);
        drawingLayer.rect(50, 10, 100, 30, 5);
        drawingLayer.noStroke();
        drawingLayer.fill("#fff");
        drawingLayer.text(edge.word, tempX, tempY);
        drawingLayer.fill(red);
        drawingLayer.text("ADITI NETI", 100, 10 + 30/2);

        
      } else if (edge.speaker === "Aarati") {
        // For Aarati: yellow rectangle with white border and red text.
        drawingLayer.fill(lightblue);
        drawingLayer.stroke("#FFF");
        drawingLayer.strokeWeight(2);
        drawingLayer.rect(tempX - tw / 2, tempY - th / 2, tw, th, 5);
        drawingLayer.fill(blue);
        drawingLayer.rect(160, 10, 180, 30, 5);
        drawingLayer.noStroke();
        drawingLayer.fill(blue);
        drawingLayer.text(edge.word, tempX, tempY);
        drawingLayer.fill("#fff");
        drawingLayer.text("AARATI AKKAPEDI", 250, 10 + 30/2);


      } else if (edge.speaker === "Vijaya") {
        // For Vijaya: dark blue rectangle with white border and yellow text.
        drawingLayer.fill(blue);        // rectangle fill: dark blue
        drawingLayer.stroke("#fff");          // white border
        drawingLayer.strokeWeight(2);
        drawingLayer.rect(tempX - tw / 2, tempY - th / 2, tw, th, 5);
        drawingLayer.fill(lightblue);
        drawingLayer.rect(350, 10, 160, 30, 5);
        drawingLayer.noStroke();
        drawingLayer.fill(yellow);            // text: yellow
        drawingLayer.text(edge.word, tempX, tempY);
        drawingLayer.fill(red);
        drawingLayer.text("VIJAYA MOHAN", 430, 10 + 30/2);
      } else if (edge.speaker === "Nagarajan") {
        // For Nagarajan: dark blue rectangle with white border and yellow text.
        drawingLayer.fill(yellow);        // rectangle fill: dark blue
        drawingLayer.stroke("#fff");          // white border
        drawingLayer.strokeWeight(2);
        drawingLayer.rect(tempX - tw / 2, tempY - th / 2, tw, th, 5);
        drawingLayer.fill(blue);
        drawingLayer.rect(520, 10, 240, 30, 5);
        drawingLayer.noStroke();
        drawingLayer.fill(blue);            // text: yellow
        drawingLayer.text(edge.word, tempX, tempY);
        drawingLayer.fill(yellow);
        drawingLayer.text("DR. VIJAYA NAGARAJAN", 635, 10 + 30/2);
      } else {
        // Fallback styling.
        drawingLayer.fill(getDrawingColor());
        drawingLayer.stroke("#fff");
        drawingLayer.strokeWeight(2);
        drawingLayer.rect(tempX - tw / 2, tempY - th / 2, tw, th, 5);
        drawingLayer.noStroke();
        drawingLayer.fill(getDrawingColor() === red ? "#fff" : red);
        drawingLayer.text(edge.word, tempX, tempY);
      }
    }

    // drawingLayer.push();
    
    // drawin

  }
  
  // Draw all cap arcs (e.g., when a branch terminates).
  for (let arcInfo of capArcs) {
    drawingLayer.push();
    drawingLayer.stroke(blue); // Now blue.
    loopAroundOnLayer(drawingLayer, arcInfo.dot, arcInfo.angle, arcInfo.start, arcInfo.stop);
    // Optionally draw the word for the cap arc:
    // if (arcInfo.word && arcInfo.word !== "") {
    //   //drawingLayer.fill(0);
    //   drawingLayer.noStroke();
    //   drawingLayer.textSize(18);
    //   drawingLayer.textAlign(CENTER, CENTER);
    //   let tw=textWidth(arcInfo.word);
    //   tw=tw*1.8;
    //   let th=25;
    //   if (colormode==0) drawingLayer.fill(red);
    //    else if (colormode==1) drawingLayer.fill(yellow);
    //    drawingLayer.stroke("#fff");
    //    drawingLayer.strokeWeight(2);
    //     drawingLayer.rect(arcInfo.dot.x-tw/2, arcInfo.dot.y-th/2, tw, th, 5, 5, 5, 5);
    //      drawingLayer.noStroke();
    //     if (colormode==0) drawingLayer.fill("#fff");
    //   else if (colormode==1) drawingLayer.fill(red);
    //   drawingLayer.text(arcInfo.word, arcInfo.dot.x, arcInfo.dot.y);
    // }
    drawingLayer.pop();
  }
  drawingLayer.pop();
}

// ------------- DFS POINTER -------------
function drawPointer() {
  if (dfsStack.length > 0) {
    let currentDot = pullis[dfsStack[dfsStack.length - 1]];
    pointerLayer.fill(0, 255, 0);
    pointerLayer.stroke(0);
    pointerLayer.strokeWeight(sw);
   // pointerLayer.ellipse(currentDot.x, currentDot.y, 10, 10);
  }
}

// ------------- DFS & EDGE FUNCTIONS -------------
function extendSameDirection() {
  if (dfsStack.length === 0) return;
  let currentIndex = dfsStack[dfsStack.length - 1];
  let currentDot = pullis[currentIndex];

  if (!lastVector) {
    return extendRandom(currentIndex);
  }

  let candidateX = currentDot.x + lastVector.dx * spacing;
  let candidateY = currentDot.y + lastVector.dy * spacing;
  let candidateIndex = findDotByCoord(candidateX, candidateY);

  if (candidateIndex !== -1 && !visited.has(candidateIndex)) {
    addEdge(currentIndex, candidateIndex, { dx: lastVector.dx, dy: lastVector.dy });
  } else {
    extendRandom(currentIndex);
  }
}

function extendTurn() {
  if (dfsStack.length === 0) return;
  let currentIndex = dfsStack[dfsStack.length - 1];
  let currentDot = pullis[currentIndex];

  if (!lastVector) {
    return extendRandom(currentIndex);
  }

  let turnLeft = random() < 0.5;
  let newVector;
  if (turnLeft) {
    newVector = { dx: -lastVector.dy, dy: lastVector.dx };
  } else {
    newVector = { dx: lastVector.dy, dy: -lastVector.dx };
  }

  let candidateX = currentDot.x + newVector.dx * spacing;
  let candidateY = currentDot.y + newVector.dy * spacing;
  let candidateIndex = findDotByCoord(candidateX, candidateY);

  if (candidateIndex !== -1 && !visited.has(candidateIndex)) {
    addEdge(currentIndex, candidateIndex, newVector);
  } else {
    newVector = turnLeft
      ? { dx: lastVector.dy, dy: -lastVector.dx }
      : { dx: -lastVector.dy, dy: lastVector.dx };
    candidateX = currentDot.x + newVector.dx * spacing;
    candidateY = currentDot.y + newVector.dy * spacing;
    candidateIndex = findDotByCoord(candidateX, candidateY);
    if (candidateIndex !== -1 && !visited.has(candidateIndex)) {
      addEdge(currentIndex, candidateIndex, newVector);
    } else {
      extendRandom(currentIndex);
    }
  }
}

function terminateBranch() {
  if (dfsStack.length === 0) return;
  let currentIndex = dfsStack[dfsStack.length - 1];
  let currentDot = pullis[currentIndex];
  let r_angle = lastVector ? atan2(lastVector.dy, lastVector.dx) + PI : 0;

  // Pull next word (or empty string)
  let word = transcriptWords.shift() || "";

  // Refill transcriptWords if empty
  if (transcriptWords.length === 0) {
    transcriptWords = transcriptText.trim().split(/\s+/);
  }

  // Handle speaker‑change
  if (word === "Aditi" || word === "Aarati" || word === "Vijaya" || word === "Nagarajan") {
    if (currentSpeaker !== word) {
      clearKolam();
      currentSpeaker = word;
      updateSpeakerInfo();

    }
    word = "";
  }

  capArcs.push({
    dot: currentDot,
    angle: r_angle,
    start: PI/4,
    stop: (dfsStack.length === 1 ? PI*9/4 : PI*7/4),
    word: word
  });

  // Reverse the DFS path back to its root
  while (dfsStack.length > 1) {
    let childIndex = dfsStack.pop();
    let parentIndex = dfsStack[dfsStack.length - 1];
    let childDot = pullis[childIndex];
    let parentDot = pullis[parentIndex];
    let reverseVector = {
      dx: (parentDot.x - childDot.x) / spacing,
      dy: (parentDot.y - childDot.y) / spacing
    };
    addReverseEdge(childIndex, parentIndex, reverseVector);
  }
  dfsStack = [];
  lastVector = null;

  // Start a new branch if any dots remain unvisited
  let unvisitedIndices = pullis.map((_, i) => i).filter(i => !visited.has(i));
  if (unvisitedIndices.length > 0) {
    let newSource = random(unvisitedIndices);
    visited.add(newSource);
    dfsStack.push(newSource);
    startingPoints.push(newSource);
  } else {
    clearKolam();
  }
}


function updateSpeakerInfo() {
  let infoText = "";
  if (currentSpeaker === "Aditi") {
    infoText = "<p style='margin:0; font-size:12px;'>Aditi Neti is a South Asian creative technologist and designer exploring the intersection of cultural traditions and technology. Through interviews and experiments, she investigates how Kolam, a traditional South Indian art form, can be reimagined using generative design and human-machine interaction.</p>";
  } else if (currentSpeaker === "Aarati") {
    infoText = "<p style='margin:0; font-size:12px;'>Aarati Akkapeddi is a Telugu-American cross-disciplinary artist whose practice merges generative algorithms with cultural archives to explore diaspora, memory, and traditions like Kolam. Her approach to bridging analog ritual and digital space makes her an invaluable perspective for a project reimagining kolam creation.</p>";
  } else if (currentSpeaker === "Vijaya") {
    infoText = "<p style='margin:0; font-size:12px;'>Vijaya Mohan is a renowned rangoli artist in Singapore, known for using her art to foster community connections and promote emotional well-being through workshops and art therapy. A Guinness World Record holder for the world’s largest rangoli, she continues to inspire inclusivity and cultural appreciation through her vibrant, collaborative creations.</p>";
  } else if (currentSpeaker === "Nagarajan") {
    infoText = "<p style='margin:0; font-size:12px;'>Dr. Vijaya Nagarajan is an Associate Professor of Theology/Religious Studies and Environmental Studies at the University of San Francisco, and the author of *Feeding a Thousand Souls: Women, Ritual, and Ecology in India—An Exploration of the Kolam.* Her research examines how Hindu women’s ritual art practices, especially kolam-making, intersect with issues of ecology, gender, and spirituality. Given her expertise on how traditional practices adapt to modern contexts, she offers essential insights for this project’s focus on reimagining kolams through creative technologies.</p>";
  } else {
    infoText = "<p style='margin:0; font-size:12px;'>Current Speaker: " + currentSpeaker + "</p>";
  }
  speakerDiv.html(infoText);
}





function getDrawingColor() {
  // Use red for Aditi, yellow for Aarati, or default to blue.
  if (currentSpeaker === "Aditi") return red;
  if (currentSpeaker === "Aarati") return blue;
  if (currentSpeaker === "Vijaya") return blue;
  if (currentSpeaker === "Nagarajan") return "#FFF";
  return blue;
}


function clearKolam() {
  // Clear the drawing and pointer layers (keeping the permanent grid intact).
  drawingLayer.clear();
  pointerLayer.clear();
  //background(187, 214, 213, 180);
  //background(255, 210);
  background(228, 199, 83, 210);
  
 
  // Reset the DFS and framework state (but do not touch transcriptWords so that
  // the transcript continues from where it left off).
  framework = [];
  dfsStack = [];
  capArcs = [];
  visited = new Set();
  lastVector = null;
  startingPoints = [];
  
  // Restart the DFS from dot 0.
  visited.add(0);
  dfsStack.push(0);
  startingPoints.push(0);
}


function extendRandom(currentIndex) {
  let currentDot = pullis[currentIndex];
  let neighbors = getAdjacentUnvisited(currentDot);
  if (neighbors.length > 0) {
    let nextIndex = random(neighbors);
    let nextDot = pullis[nextIndex];
    let dx = (nextDot.x - currentDot.x) / spacing;
    let dy = (nextDot.y - currentDot.y) / spacing;
    addEdge(currentIndex, nextIndex, { dx, dy });
  } else {
    terminateBranch();
  }
}

function addEdge(currentIndex, nextIndex, vector) {
  // Pull the next token (or get empty string if none)
  let word = transcriptWords.shift() || "";

  // If we’ve consumed all words, refill from the original transcript
  if (transcriptWords.length === 0) {
    transcriptWords = transcriptText.trim().split(/\s+/);
  }

  // Handle speaker‑change tokens
  if (word === "Aditi" || word === "Aarati" || word === "Vijaya" || word === "Nagarajan") {
    if (currentSpeaker !== word) {
      clearKolam();
      currentSpeaker = word;
      updateSpeakerInfo();

    }
    return;
  }

  // Otherwise add the edge as before
  framework.push({
    x: currentIndex,
    y: nextIndex,
    reverse: false,
    vector: vector,
    word: word,
    speaker: currentSpeaker
  });
  visited.add(nextIndex);
  dfsStack.push(nextIndex);
  lastVector = vector;
}





function addReverseEdge(currentIndex, parentIndex, vector) {
  framework.push({ x: currentIndex, y: parentIndex, reverse: true, vector: vector });
  lastVector = vector;
}

function findDotByCoord(x, y) {
  for (let i = 0; i < pullis.length; i++) {
    if (pullis[i].x === x && pullis[i].y === y) {
      return i;
    }
  }
  return -1;
}

function getAdjacentUnvisited(dot) {
  let indices = [];
  for (let i = 0; i < pullis.length; i++) {
    if (!visited.has(i) && isAdjacent(dot, pullis[i])) {
      indices.push(i);
    }
  }
  return indices;
}

function isAdjacent(dot1, dot2) {
  return (abs(dot1.x - dot2.x) === spacing && dot1.y === dot2.y) ||
         (dot1.x === dot2.x && abs(dot1.y - dot2.y) === spacing);
}

// ------------- DECORATION HELPER FUNCTIONS -------------
// These functions draw onto a passed-in layer.

function drawLineByAngleOnLayer(layer, angleDegrees, tempX, tempY, spacing, reverse = false) {
  const angle = (angleDegrees === 90 || angleDegrees === -90)
    ? (reverse ? (3 * PI) / 4 : PI / 4)
    : (reverse ? PI / 4 : (3 * PI) / 4);
  drawDiagonalLineOnLayer(layer, tempX, tempY, spacing * 0.33, angle);
}

function drawDiagonalLineOnLayer(layer, midX, midY, lineLength, angle) {
  let x1 = midX - cos(angle) * lineLength;
  let y1 = midY - sin(angle) * lineLength;
  let x2 = midX + cos(angle) * lineLength;
  let y2 = midY + sin(angle) * lineLength;
  layer.stroke(getDrawingColor());
  layer.strokeWeight(sw);
  layer.line(x1, y1, x2, y2);
}


function applyLoopAndStrokeOnLayer(layer, aDiff, r_angle, dot1) {
  layer.stroke(blue);
  if (aDiff === 0) {
    loopAroundOnLayer(layer, dot1, r_angle, PI / 4, PI * 3 / 4);
  } else if (aDiff === -90 || aDiff === 270) {
    loopAroundOnLayer(layer, dot1, r_angle, PI / 4, PI * 5 / 4);
  } else if (aDiff === 90 || aDiff === -270) {
    loopAroundOnLayer(layer, dot1, r_angle + PI / 2, PI / 4, PI * 5 / 4);
  }
}

function loopAroundOnLayer(layer, dot, theAngle, start, stop) {
  layer.push();
  layer.translate(dot.x, dot.y);
  layer.rotate(theAngle);
  layer.noFill();
  layer.stroke(getDrawingColor());
  layer.strokeWeight(sw);
  layer.arc(0, 0, spacing * 0.66, spacing * 0.66, start, stop);
  layer.pop();
}


// ------------- RESET & DOT CLASS -------------
function resetPattern() {
  pullis = [];
  framework = [];
  dfsStack = [];
  capArcs = [];
  visited = new Set();
  lastVector = null;
  
  // Create grid dots.
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      pullis.push(new Dot(i * spacing + spacing, j * spacing + spacing));
    }
  }
  // Start DFS from the first dot.
  visited.add(0);
  dfsStack.push(0);
}

class Dot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}
