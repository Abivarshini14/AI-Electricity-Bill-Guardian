"""
Grok (xAI) AI service layer.
If GROK_API_KEY is missing or the API call fails, deterministic rule-based
suggestions are returned instead. The application must never crash because
this external dependency is unavailable.
"""
import httpx

from app.core.config import settings

SYSTEM_PROMPT_EN = (
    "You are an electricity usage assistant for a household/shop energy management app called "
    "AI Electricity Bill Guardian. Answer only using the context data provided about the user's "
    "property, appliances, bills, and budget. Be concise, practical, and give clear energy saving "
    "recommendations in India in INR. Do not invent data not given to you."
)
SYSTEM_PROMPT_TA = (
    "நீங்கள் AI Electricity Bill Guardian எனும் மின்சார பயன்பாட்டு நிர்வாக பயன்பாட்டிற்கான உதவியாளர். "
    "வழங்கப்பட்ட தரவுகளை மட்டும் பயன்படுத்தி தமிழில் சுருக்கமாகவும் நடைமுறை ரீதியாகவும் பதிலளிக்கவும்."
)


def _rule_based_fallback(message: str, context: dict, language: str = "en") -> str:
    tips = []
    top_appliance = context.get("top_appliance")
    budget = context.get("budget")
    estimated_bill = context.get("estimated_bill")
    health_score = context.get("health_score")

    if language == "ta":
        if top_appliance:
            tips.append(f"'{top_appliance}' அதிக மின்சாரத்தை பயன்படுத்துகிறது. பயன்பாட்டு நேரத்தை குறைக்கவும்.")
        if budget and estimated_bill and estimated_bill > budget:
            tips.append(f"உங்கள் மதிப்பிடப்பட்ட பில் (₹{estimated_bill}) பட்ஜெட்டை (₹{budget}) விட அதிகமாக உள்ளது.")
        if health_score is not None:
            tips.append(f"உங்கள் பயன்பாட்டு ஆரோக்கிய மதிப்பெண்: {health_score}/100.")
        if not tips:
            tips.append("தற்போது AI சேவை கிடைக்கவில்லை. நிலையான மின் சேமிப்பு குறிப்புகளை பின்பற்றவும்.")
        return " ".join(tips)

    if top_appliance:
        tips.append(f"Your highest energy-consuming appliance is '{top_appliance}'. Reducing its daily usage hours will have the biggest impact.")
    if budget and estimated_bill and estimated_bill > budget:
        diff = round(estimated_bill - budget, 2)
        tips.append(f"Your estimated bill (₹{estimated_bill}) is projected to exceed your budget (₹{budget}) by ₹{diff}.")
    if health_score is not None:
        tips.append(f"Your current usage health score is {health_score}/100.")
    tips.append("General tips: reduce AC/water heater usage during peak hours, unplug standby devices, and check for unusually high meter jumps.")
    if not tips:
        tips.append("AI assistant is temporarily unavailable. Here are general energy-saving tips: reduce peak-hour appliance usage, service your AC filters, and switch off standby devices.")
    return " (Live AI unavailable - showing rule-based guidance) " + " ".join(tips)


async def ask_grok(message: str, context: dict, language: str = "en", history: list = None) -> dict:
    """
    Returns {"reply": str, "used_fallback": bool}
    """
    if not settings.GROK_API_KEY:
        return {"reply": _rule_based_fallback(message, context, language), "used_fallback": True}

    system_prompt = SYSTEM_PROMPT_TA if language == "ta" else SYSTEM_PROMPT_EN
    context_text = "Context data (JSON): " + str(context)

    messages = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history[-6:])
    messages.append({"role": "user", "content": f"{context_text}\n\nUser question: {message}"})

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post(
                settings.GROK_API_URL,
                headers={
                    "Authorization": f"Bearer {settings.GROK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": settings.GROK_MODEL,
                    "messages": messages,
                    "temperature": 0.4,
                    "max_tokens": 600,
                },
            )
            if resp.status_code != 200:
                return {"reply": _rule_based_fallback(message, context, language), "used_fallback": True}
            data = resp.json()
            reply = data["choices"][0]["message"]["content"]
            return {"reply": reply, "used_fallback": False}
    except Exception:
        return {"reply": _rule_based_fallback(message, context, language), "used_fallback": True}
