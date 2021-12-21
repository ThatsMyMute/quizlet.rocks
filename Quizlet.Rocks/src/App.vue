<template>
  <v-app style="background: #13141b" v-if="!iframe">
    <v-snackbar :timeout="3000" :color="color" v-model="snackbar">
      {{ notification.text }}
    </v-snackbar>
    <v-container class="ma-auto text-center" style="max-width: 1000px">
      <div v-if="state === 1" style="margin: 5vh auto">
        <v-text-field
          v-model="search"
          label="Search (start typing)"
        ></v-text-field>
        <div
          v-for="(term, index) in questions"
          v-bind:key="index"
          style="background-color: #282e3e; border-radius: 10px"
        >
          <h2 class="mb-2">{{ term.term }}</h2>
          <p>{{ term.definition }}</p>
        </div>
        <v-btn class="mt-6" color="primary" @click="Reset">Reset</v-btn>
      </div>
      <v-row style="margin-top: 20vh" v-if="state === 0">
        <v-col>
          <v-row>
            <v-col>
              <v-text-field
                v-model="gamePin"
                :rules="numberRules"
                @keyup.enter="GetAnswers"
                autocomplete="off"
                label="Game pin"
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-btn
              class="text-center mx-auto"
              color="primary"
              large
              :loading="loading"
              @click="GetAnswers"
              >Get Answers</v-btn
            >
          </v-row>
        </v-col>
      </v-row>
      <div class="ad mx-auto mt-6 d-flex">
        <div
          id="kahoot-rocks_728x90"
          style="background-image: none"
          class="mb-16"
        >
          <script type="application/javascript">
            aiptag.cmd.display.push(function() {
              aipDisplayTag.display("kahoot-rocks_728x90");
            });
          </script>
        </div>

        <div id="kahoot-rocks_300x250">
          <script type="application/javascript">
            aiptag.cmd.display.push(function() {
              aipDisplayTag.display("kahoot-rocks_300x250");
            });
          </script>
        </div>
      </div>
    </v-container>
    <v-footer
      app
      class="d-flex flex-row text-center"
      style="background-color: #282e3e"
    >
      <div class="mx-auto">
        <span>&copy; {{ new Date().getFullYear() }} Quizlet Rocks</span>
        <span class="px-1">|</span>
        <span>v1.0.0</span>
        <span class="px-1">|</span>
        <span
          ><a
            href="https://chrome.google.com/webstore/detail/quizlet-rocks/pgbnfimhfgoibnimmfoeacjehkecgkmk"
            style="color: #8563a6"
            >Extension</a
          ></span
        >
        <span class="px-1">|</span>
        <span
          ><a href="https://rocks.network/discord" style="color: #8563a6"
            >Discord Server</a
          ></span
        >
      </div>
    </v-footer>
  </v-app>
  <v-app v-else>
    <div class="text-center d-flex" style="height: 100vh">
      <span class="ma-auto"
        >This is an unnoficial version of quizlet.rocks. Please use the official
        version at https://quizlet.rocks</span
      >
    </div>
  </v-app>
</template>

<script>
import Fuse from "fuse.js";
/* eslint-disable @typescript-eslint/no-explicit-any */

export default {
  name: "App",
  data() {
    return {
      terms: [],
      search: "",
      gamePin: "",
      numberRules: [
        value => {
          const regex = /^[0-9 -]*$/gm;
          return (
            regex.test(value) ||
            (value == "" || value == null ? true : "Has to be a number")
          );
        }
      ],
      loading: false,
      state: 0,
      notification: {
        text: "",
        type: "",
        active: false
      }
    };
  },
  computed: {
    iframe() {
      return window.self !== window.top;
    },
    questions() {
      if (this.search === "") return this.terms;

      const fuse = new Fuse(this.terms, { keys: ["term", "definition"] });
      const result = fuse.search(this.search);
      return result.map(r => r.item);
    },
    snackbar: {
      get() {
        return this.notification.active;
      },
      set(value) {
        this.notification.active = value;
      }
    },
    color() {
      switch (this.notification.type) {
        case "ERROR":
          return "red";
        case "WARN":
          return "#FFC71E";
        default:
          return "green";
      }
    },
    theme() {
      return this.$vuetify.theme.dark ? "dark" : "light";
    }
  },
  methods: {
    Reset() {
      this.state = 0;
      this.terms = [];
      this.gamePin = "";
      this.loading = false;
      this.notification = {
        text: "",
        type: "",
        active: false
      };
    },
    Notify(text, type) {
      this.loading = false;
      this.notification.text = text;
      this.notification.type = type;
      this.notification.active = true;
    },
    async GetAnswers() {
      this.loading = true;
      try {
        const gamePin = this.gamePin.replaceAll(" ", "").replaceAll("-", "");
        if (isNaN(Number(gamePin))) return (this.loading = false);

        const filters = {
          gameCode: gamePin,
          isInProgress: true,
          isDeleted: false
        };
        const gameInstances = await fetch(
          `https://proxy.quizlet.rocks/webapi/3.2/game-instances?filters=${encodeURIComponent(
            JSON.stringify(filters)
          )}&perPage=500`
        )
          .then(res => res.json())
          .then(j => j.responses[0].models.gameInstance);
        if (gameInstances.length === 0)
          return this.Notify("Game pin invalid", "ERROR");

        const html = await fetch(
          `https://proxy.quizlet.rocks/${gameInstances[0].itemId}/`
        ).then(res => res.text());
        this.terms = [];
        for (const [, value] of Object.entries(
          JSON.parse(
            html.substring(
              html.indexOf('(function(){window.Quizlet["setPageData"] = ') + 44,
              html.indexOf('; QLoad("Quizlet.setPageData");}).call(this)')
            )
          ).termIdToTermsMap
        )) {
          this.terms.push({
            term: value.word,
            definition: value.definition
          });
        }
        this.state = 1;
      } catch (e) {
        this.Notify(e, "ERROR");
      }
      this.loading = false;
    },
    CheckForAdblock() {
      fetch(
        " https://api.adinplay.com/libs/aiptag/pub/KHR/kahoot.rocks/tag.min.js"
      ).catch(() => {
        const style = document.createElement("style");
        style.innerHTML = `#kahoot-rocks_728x90{width:728px;height:90px;background-image:url("/${
          this.$vuetify.theme.dark ? "dark" : "light"
        }adblock728.png");}#kahoot-rocks_300x250{width:300px;height:250px;background-image:url("/${
          this.$vuetify.theme.dark ? "dark" : "light"
        }adblock300.png");}`;
        document.body.appendChild(style);
      });
    }
  },
  mounted() {
    this.CheckForAdblock();
  }
};
</script>

<style>
#kahoot-rocks_728x90,
#kahoot-rocks_300x250 {
  margin: auto;
}
@media only screen and (max-width: 850px) {
  #kahoot-rocks_300x250 {
    display: unset;
  }
  #kahoot-rocks_728x90 {
    display: none;
  }
}
@media only screen and (min-width: 850px) {
  #kahoot-rocks_300x250 {
    display: none;
  }
  #kahoot-rocks_728x90 {
    display: unset;
  }
}

*::-webkit-scrollbar {
  display: none;
}

* {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
