import asyncio
from langgraph.graph import StateGraph, START, END
from state import BuddyState
from nodes import intent_router, chat_node, summary_node, test_node

def route_after_intent(state: BuddyState) -> str:
    mode = state.get("mode", "chat")
    return mode

builder = StateGraph(BuddyState)

builder.add_node("intent_router", intent_router)
builder.add_node("chat", chat_node)
builder.add_node("summary", summary_node)
builder.add_node("test", test_node)

builder.add_edge(START, "intent_router")
builder.add_conditional_edges(
    "intent_router",
    route_after_intent,
    {
        "chat": "chat",
        "summary": "summary",
        "test": "test"
    }
)

builder.add_edge("chat", END)
builder.add_edge("summary", END)
builder.add_edge("test", END)

graph = builder.compile()

async def run_chat(state: BuddyState):
    result = await graph.ainvoke(state)
    return result

def run_chat_sync(state: BuddyState):
    result = asyncio.run(graph.ainvoke(state))
    return result