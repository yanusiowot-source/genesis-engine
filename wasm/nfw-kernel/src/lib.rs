#![no_std]
#![no_main]

use libm::{atan, atanh, log, sqrt};

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    loop {}
}

fn nfw_f_js(x: f64) -> f64 {
    let u = if x < 0.0 { -x } else { x };
    if u < 1e-6 {
        let d = if u > 1e-8 { u } else { 1e-8 };
        return log(2.0 / d);
    }
    if abs(u - 1.0) < 1e-5 {
        return 1.0;
    }
    if u < 1.0 {
        let inner = 1.0 - u * u;
        let d = sqrt(if inner > 1e-12 { inner } else { 1e-12 });
        let a = if d < 0.999999 { d } else { 0.999999 };
        return atanh(a) / d;
    }
    let d = sqrt(u * u - 1.0);
    atan(d) / d
}

fn abs(v: f64) -> f64 {
    if v < 0.0 { -v } else { v }
}

fn max(a: f64, b: f64) -> f64 {
    if a > b { a } else { b }
}

#[no_mangle]
pub extern "C" fn nfw_f(x: f64) -> f64 {
    nfw_f_js(x)
}

#[no_mangle]
pub extern "C" fn nfw_kappa(x: f64, ks: f64) -> f64 {
    let u = max(abs(x), 1e-5);
    if abs(u - 1.0) < 1e-4 {
        return (2.0 * ks) / 3.0;
    }
    (2.0 * ks * (1.0 - nfw_f_js(u))) / (u * u - 1.0)
}

#[no_mangle]
pub extern "C" fn nfw_mean_kappa(x: f64, ks: f64) -> f64 {
    let u = max(abs(x), 1e-5);
    (4.0 * ks * (log(u / 2.0) + nfw_f_js(u))) / (u * u)
}

#[no_mangle]
pub extern "C" fn nfw_einstein_x(ks: f64) -> f64 {
    let mut lo = 0.15;
    let mut hi = 14.0;
    let mut i = 0;
    while i < 22 {
        let mid = (lo + hi) * 0.5;
        if nfw_mean_kappa(mid, ks) > 1.0 {
            lo = mid;
        } else {
            hi = mid;
        }
        i += 1;
    }
    (lo + hi) * 0.5
}
