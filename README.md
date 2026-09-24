▶️ **Demo video:** https://youtu.be/BModvYp6NxE

---

# O-Astra (Open Astra): Autonomous Computer Use Agent

**O-Astra (Open Astra)**, formerly known as ARIA, is a multi-agent system that operates a live desktop the way a person would: it looks at the screen, decides what to do, clicks and types through VNC, and checks whether the action worked. Eight specialised agents coordinate through a shared Redis memory, and the whole stack runs in Docker.

> **Status:** Research project (2025). Private repository.
> **Author:** [Nabil Thange](https://nabil-thange.vercel.app)



---

## Why O-Astra

Single-agent computer-use systems tend to fail on long tasks. One model has to plan, perceive, act, and recover from errors all in one context, and a single mistake compounds. O-Astra splits those responsibilities across specialised agents that share state, so each agent has a narrow job and failures can be caught and recovered from by another agent.

**Result:** ~20% accuracy improvement over the open-source computer-use baselines I compared against.


---

---

## Architecture

```
                        ┌──────────────────────┐
        User task  ───► │   Planning / Coord   │
                        └──────────┬───────────┘
                                   │
          ┌────────────────────────┼─────────────────────────┐
          ▼                        ▼                         ▼
   ┌─────────────┐          ┌─────────────┐           ┌──────────────┐
   │   Vision    │          │  Execution  │           │ Verification │
   │ (read screen)│         │ (act on VNC)│           │ (did it work)│
   └──────┬──────┘          └──────┬──────┘           └──────┬───────┘
          │                        │                         │
          └────────────┬───────────┴────────────┬────────────┘
                       ▼                        ▼
              ┌─────────────────┐      ┌────────────────┐
              │  Redis (shared  │      │ Error handling │
              │  memory / state)│      │  & Learning    │
              └─────────────────┘      └────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  Live VNC       │
              │  desktop (Docker)│
              └─────────────────┘
```

### The 8 agents

| # | Agent | Responsibility |
|---|-------|----------------|
| 1 | Planning | Breaks the user's task into ordered steps |
| 2 | Coordination | Routes steps to agents and prevents conflicting actions |
| 3 | Vision | Reads the screen and describes what is currently visible |
| 4 | Execution | Performs mouse and keyboard actions over VNC |
| 5 | Verification | Checks whether each action produced the expected result |
| 6 | Error handling | Detects failures and triggers retries or fallbacks |
| 7 | Memory | Reads and writes shared state in Redis |
| 8 | Learning | Records what worked and what did not to improve later runs |


### Shared memory (Redis)

All agents read and write a common state in Redis instead of passing messages point to point. This keeps every agent in sync on:

- the current plan and which step is active
- the latest screen observation
- action history and results
- errors and retry counts


### Desktop control (VNC)

The agent connects to a live desktop over VNC. Screenshots come in, mouse and keyboard events go out. The desktop runs in its own Docker container, so O-Astra never touches the host machine.

---

## Tech Stack

- **Language:** Python
- **Orchestration:** Multi-agent workflow (LangGraph) 
- **Shared memory:** Redis
- **Desktop control:** VNC
- **Infrastructure:** Docker / Docker Compose


---

## Getting Started

### Prerequisites

- Docker and Docker Compose

### Run

```bash
git clone <repo-url>
cd o-astra
cp .env.example .env      # add your API keys
docker compose up --build
```



```bash
# example
python main.py --task "Open the browser and search for ..."
```

---

## Project Structure

```
o-astra/
├── agents/          # the 8 agents
├── memory/          # Redis client and state schema
├── vnc/             # desktop connection and input control
├── docker/          # Dockerfiles and compose config
├── main.py          # entry point
└── README.md
```



---

## Known Limitations

- VNC latency can slow down action loops on long tasks
- Coordination overhead means simple tasks are slower than a single-agent approach
- Accuracy depends on how reliably the vision agent reads the screen


## Future Work

- More rigorous benchmarking against public computer-use evaluations
- Faster perception loop to reduce latency


---

## Notes

This is a research prototype, not production software. Setup steps and configuration may need adjusting for your environment.

## Contact

Nabil Thange · thangenabil@gmail.com · [GitHub](https://github.com/NabilThange) · [LinkedIn](https://www.linkedin.com/in/nabil-thange/)
